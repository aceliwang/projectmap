let data
let tracker = document.getElementById('tracker')
let addBtn = document.getElementById('add')
let saveBtn = document.getElementById('save')
let delBtn = document.getElementById('delete')
let importBtn = document.getElementById('import')
let dlBtn = document.getElementById('download')
let parentDatalist = document.getElementById('parents')
document.selected = []

// editors
let nameEditor = document.getElementById('nameEditor')
let detailEditor = document.getElementById('detailEditor')
let statusEditor = document.getElementById('statusEditor')
let parentEditor = document.getElementById('parentEditor')

// other
let exportFile

var printStatusColor = function (issueNode, status) {
    switch (status) {
        case 'todo':
            issueNode.style.color = 'red'
            break;
        case 'done':
            issueNode.style.color = 'green'
            break;
        case 'active':
            issueNode.style.color = 'blue'
            break;
        case 'paused':
            issueNode.style.color = 'orange'
            break;
        default:
            break;
    }
}

var print = function (feature, parentNode, level) {
    let name = feature.name
    let status = feature.status
    let children = feature.children
    let details = feature.details
    let issueNode = document.createElement('div')
    // issueNode.style.display = 'inline-block'
    issueNode.innerText = name
    issueNode.name = name
    issueNode.status = status
    issueNode.details = details
    issueNode.children = children
    issueNode.level = level
    issueNode.parent = parentNode.name || 'top'
    issueNode.style.paddingLeft = (level - 1) * 3 + '%'
    issueNode.onclick = (evt) => {
        evt.stopPropagation()
        // if (document.selected.includes(issueNode)) { // unclick
        // document.selected = document.selected.filter(item => item != issueNode)
        // console.log('clicked', document.selected)
        // issueNode.style.fontWeight = 'normal'
        // select(true)
        // } else 
        if (evt.ctrlKey && document.selected.includes(issueNode)) { // ctrl + unclick
            document.selected = document.selected.filter(feature => feature != issueNode)
            issueNode.style.fontWeight = 'normal'
            select()
        } else if (evt.ctrlKey) { // ctrl + click
            document.selected.push(issueNode)
            issueNode.style.fontWeight = 'bold'
            select()
        } else { // click
            // console.log('click feature')
            document.selected.forEach(issue =>
                issue.style.fontWeight = 'normal'
            )
            document.selected = [issueNode]
            select()
        }
        // console.log(document.selected.map(feature => feature.name))
    }
    printStatusColor(issueNode, status)
    if (level === 1) {
        parentNode.append(issueNode)
    } else {
        parentNode.insertAdjacentElement('afterend', issueNode)
    }
    children.forEach(child => {
        print(child, issueNode, level + 1)
    })
    return issueNode
}

var add = function () {
    let parentNode = document.selected[0] ? document.selected[0] : tracker
    let level = document.selected[0] ? document.selected[0].level + 1 : 1
    console.log(parentNode, level)
    document.selected.forEach(feature => {
        feature.style.fontWeight = 'normal'
    })
    document.selected = [print({
        "name": "new feature",
        "status": "todo",
        "details": "",
        "children": []
    }, parentNode, level)]
    save()
    select()
}

var select = function (empty) {
    while (parentDatalist.firstChild) {
        parentDatalist.removeChild(parentDatalist.firstChild)
    }
    if (empty) {
        nameEditor.value = ''
        statusEditor.value = ''
        detailEditor.value = ''
        parentEditor.value = ''
        nameEditor.disabled = true
        statusEditor.disabled = true
        parentEditor.disabled = true
        detailEditor.disabled = true
    } else {
        // console.log(document.selected.every(
        // feature => feature.name === document.selected[0].name))
        nameEditor.value = document.selected.every(feature => feature.name === document.selected[0].name)
            ? document.selected[0].name
            : 'different values'
        statusEditor.value = document.selected.every(feature => feature.status === document.selected[0].status)
            ? document.selected[0].status
            : 'different values'
        detailEditor.value = document.selected.every(feature => feature.details === document.selected[0].details)
            ? document.selected[0].details
            : 'different values'
        parentEditor.value = document.selected.every(feature => feature.parent === document.selected[0].parent)
            ? document.selected[0].parent
            : 'different values'
        let top = document.createElement('option')
        top.innerText = 'top'
        parentDatalist.append(top)
        tracker.childNodes.forEach(feature => {
            if (feature.name != document.selected[0].name) {
                let option = document.createElement('option')
                option.innerText = feature.name
                parentDatalist.append(option)
            }
        })
        document.selected[0].style.fontWeight = 'bold'
        nameEditor.disabled = false
        statusEditor.disabled = false
        parentEditor.disabled = false
        detailEditor.disabled = false
    }
    if (document.selected.length <= 1) {
        addBtn.disabled = false
    } else {
        addBtn.disabled = true
    }
}

nameEditor.onchange = function () {
    document.selected.forEach(node => {
        node.innerText = this.value
        node.name = this.value
    })
    save()
}

detailEditor.onchange = function () {
    document.selected.forEach(node => {
        node.details = this.value
    })
    save()
}

statusEditor.onchange = function () {
    document.selected.forEach(node => {
        printStatusColor(node, this.value)
        node.status = this.value
    })
    save()
}

parentEditor.onfocus = function () {
    this.value = ''
}

parentEditor.onchange = function () {
    let features = tracker.childNodes
    if (this.value === 'top') {
        document.selected.forEach(feature => {
            feature.parent = 'top'
            tracker.lastChild.insertAdjacentElement('afterend', feature)
            feature.style.paddingLeft = '0%'
            feature.level = 1
        })
    } else {
        for (let i = 0; i < features.length; i++) {
            if (features[i].name === this.value) {
                parent = features[i]
                break
            }
        }
        document.selected.forEach(feature => {
            feature.parent = parent.name
            parent.insertAdjacentElement('afterend', feature)
            feature.level = parent.level + 1
            feature.style.paddingLeft = (parent.level) * 3 + '%'
        })
    }
    save()
}

var save = function () {
    let queue = []
    let json = { features: [] }
    tracker.childNodes.forEach(node => {
        if (node.level < queue.length) { // if level has dropped
            let difference = queue.length - node.level
            for (let i = 0; i < difference; i++) {
                let collapse = queue.pop()
                queue.slice(-1)[0].slice(-1)[0].children.push(...collapse)
            }
            queue.slice(-1)[0].push({
                name: node.name,
                status: node.status,
                details: node.details,
                children: []
            })
        } else if (node.level === queue.length) { // if same level
            queue.slice(-1)[0].push({
                name: node.name,
                status: node.status,
                details: node.details,
                children: []
            })
        } else if (node.level > queue.length) { // if level has increased
            queue.push([{
                name: node.name,
                status: node.status,
                details: node.details,
                children: []
            }])
        }
    })
    for (let i = 1; i < queue.length; i++) {
        let collapse = queue.pop()
        queue.slice(-1)[0].slice(-1)[0].children.push(...collapse)
    }
    queue.forEach(feature => {
        json.features.push(...feature)
    })
    json = JSON.stringify(json)
    // console.log(json)
    document.cookie = "save=" + json
    localStorage.setItem('save', json)
    exportFile = json
}

checkConsecutive = (array) => {
    return Math.max(array) - Math.min(array) === array.length - 1
}

document.getElementById('selectnone').onclick = (evt) => {
    evt.stopPropagation()
    document.selected.forEach(feature => {
        feature.style.fontWeight = 'normal'
    })
    document.selected = []
    select(true)
}

document.getElementById('moveup').onclick = (evt) => {
    evt.stopPropagation()
    // check if consecutive
    let features = new Array(...tracker.childNodes)
    let indicies = document.selected.map(feature => features.indexOf(feature))
    let firstElement = tracker.childNodes[Math.min(indicies)]
    let lastElement = tracker.childNodes[Math.max(indicies)]
    if (checkConsecutive(indicies) && firstElement.previousSibling) {
        console.log('true')
        lastElement.insertAdjacentElement('afterEnd', firstElement.previousSibling)
    } else {
        document.selected.forEach(feature => {
            if (feature.nextSibling) {
                feature
            }
        })
    }
    
}

document.getElementById('movedown').onclick = (evt) => {
    evt.stopPropagation()
    // check if consecutive
    let features = new Array(...tracker.childNodes)
    let indicies = document.selected.map(feature => features.indexOf(feature))
    let lastElement = tracker.childNodes[Math.max(indicies)]
    if (checkConsecutive(indicies) && lastElement.nextSibling) {
        console.log('true')
        let firstElement = tracker.childNodes[Math.min(indicies)]
        firstElement.insertAdjacentElement('beforeBegin', lastElement.nextSibling)
    }
    
}

addBtn.onclick = (evt) => {
    evt.stopPropagation()
    add()
}

saveBtn.onclick = (evt) => {
    evt.stopPropagation()
    save()
}

delBtn.onclick = (evt) => {
    evt.stopPropagation()
    document.selected.forEach(feature => {
        while (feature.nextSibling && feature.nextSibling.level > feature.level) {
            let adjacent = feature.nextSibling
            adjacent.level = adjacent.level - 1
            adjacent.style.paddingLeft = (adjacent.level - 1) * 3 + '%'
            adjacent.insertAdjacentElement('afterend', feature)
        }
        tracker.removeChild(feature)
    })
    save()
    select(true)
    // https://web.dev/file-system-access/
}

importBtn.onclick = async (evt) => {
    evt.stopPropagation()
    while (tracker.firstChild) {
        tracker.removeChild(tracker.firstChild)
    }
    let [fileHandle] = await window.showOpenFilePicker()
    let file = await fileHandle.getFile()
    let contents = await file.text()
    importJSON(JSON.parse(contents))
}

dlBtn.onclick = (evt) => {
    evt.stopPropagation()
    if (!exportFile) {
        save()
    }
    let a = document.createElement('a')
    let file = new Blob([exportFile], { type: 'text/plain' })
    a.href = URL.createObjectURL(file)
    a.download = 'projectmapsavefile.json'
    a.click()
    document.removeChild(a)
}

select(true)

debugLevels = () => {
    tracker.childNodes.forEach(feature => {
        console.log(feature.level)
    })
}

var importJSON = (data) => {
    data.features.forEach(feature => {
        print(feature, tracker, 1)
    })
}

if (localStorage.getItem('save')) {
    data = JSON.parse(localStorage.getItem('save'))
    importJSON(data)
} else if (document.cookie) {
    let cookies = document.cookie.split(';')
    let saveData
    for (let i = 0; i < cookies.length; i++) {
        if (cookies[i].includes('save')) {
            saveData = cookies[i].split('=')[1]
            break
        }
    }
    data = JSON.parse(saveData)
    importJSON(data)
} else {
    fetch('./projectmap.json')
        .then(response => response.json(),
            () => alert('No save file found. Import or start fresh.'))
        .then(json => {
            data = json
            importJSON(data)
        })
}
