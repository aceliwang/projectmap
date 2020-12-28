let data
let tracker = document.getElementById('tracker')
let addBtn = document.getElementById('add')
let saveBtn = document.getElementById('save')
let parentDatalist = document.getElementById('parents')
document.selected = []

// editors
let nameEditor = document.getElementById('nameEditor')
let detailEditor = document.getElementById('detailEditor')
let statusEditor = document.getElementById('statusEditor')
let parentEditor = document.getElementById('parentEditor')

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
        if (document.selected.includes(issueNode)) { // unclick
            document.selected = document.selected.filter(item => item != issueNode)
            console.log('clicked', document.selected)
            issueNode.style.fontWeight = 'normal'
            select(true)
        } else if (evt.ctrlKey && document.selected.includes(issueNode)) { // ctrl + unclick
        } else if (evt.ctrlKey) { // ctrl + click
            document.selected.push(issueNode)
            issueNode.style.fontWeight = 'bold'
        } else { // click
            console.log('click feature')
            document.selected.forEach(issue =>
                issue.style.fontWeight = 'normal'
            )
            document.selected = [issueNode]
            select()
        }

        console.log(document.selected)
    }
    printStatusColor(issueNode, status)
    if (level === 1) {
        parentNode.append(issueNode)
    } else {
        console.log(parentNode.name)
        parentNode.insertAdjacentElement('afterend', issueNode)
    }
    children.forEach(child => {
        console.log(child)
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

    select()
}

var select = function (empty) {
    console.log(document.selected)
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
        nameEditor.value = document.selected[0].name
        statusEditor.value = document.selected[0].status
        detailEditor.value = document.selected[0].details
        parentEditor.value = document.selected[0].parent
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
}

detailEditor.onchange = function () {
    document.selected.forEach(node => {
        node.details = this.value
    })
}

statusEditor.onchange = function () {
    document.selected.forEach(node => {
        printStatusColor(node, this.value)
        node.status = this.value
    })
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
}

fetch('./projectmap.json')
    .then(response => response.json())
    .then(json => {
        data = json
        data.features.forEach(feature => {
            print(feature, tracker, 1)
        })
        console.log(typeof tracker.childNodes)
    })

var save = function () {
    console.log(tracker.childNodes[0])
    let queue = []
    let json = { features: [] }
    tracker.childNodes.forEach(node => {
        // console.log(node.name, node.status, node.details, node.level, node.parent)
        // console.log('queue', queue)
        console.log(node.level)
        if (node.level < queue.length) { // if level has dropped
            let difference = queue.length - node.level
            for (let i = 0; i < difference; i++) {
                let collapse = queue.pop()
                // console.log("collapse", collapse)
                queue.slice(-1)[0].slice(-1)[0].children.push(...collapse)
            }
            queue.slice(-1)[0].push({
                name: node.name,
                status: node.status,
                details: node.details,
                children: []
            })
        } else if (node.level === queue.length) { // if same level
            console.log('trigger')
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
    console.log(json)
}

document.getElementById('selectnone').onclick = (evt) => {
    console.log('selectnone')
    evt.stopPropagation()
    document.selected.forEach(feature => {
        feature.style.fontWeight = 'normal'
    })
    document.selected = []
    select(true)
}

addBtn.onclick = (evt) => {
    evt.stopPropagation()
    add()
}

saveBtn.onclick = (evt) => {
    evt.stopPropagation()
    save()
}

select(true)

debugLevels = () => {
    tracker.childNodes.forEach(feature => {
        console.log(feature.level)
    })
}