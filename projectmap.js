let data
let tracker = document.getElementById('tracker')
let title = document.getElementById('title')
document.selected = []

// buttons
let addBtn = document.getElementById('add')
let saveBtn = document.getElementById('save')
let delBtn = document.getElementById('delete')
let importBtn = document.getElementById('import')
let dlBtn = document.getElementById('download')

// lists
let activeList = document.getElementById('active')
let archiveList = document.getElementById('archive')
let sessionList = document.getElementById('session-list')

// editors
let nameEditor = document.getElementById('nameEditor')
let detailEditor = document.getElementById('detailEditor')
let statusEditor = document.getElementById('statusEditor')
let parentEditor = document.getElementById('parentEditor')
let parentDatalist = document.getElementById('parents')

// other
let exportFile
let hideActive = hideDone = false

var printStatusColor = function (node, status) {
    switch (status) {
        case 'todo':
            node.style.color = 'red'
            break
        case 'done':
            node.style.color = 'green'
            break
        case 'active':
            node.style.color = 'blue'
            break
        case 'paused':
            node.style.color = 'orange'
            break
        default:
            break
    }
}

var debugStatement = (feature) => {
    return `${feature.name} | ${feature.status} | ${feature.level} | ${feature.parent}`
}

var print = function (feature, parent, level) {
    let name = feature.name
    let status = feature.status
    let children = feature.children
    let details = feature.details
    let node = document.createElement('div')
    let clickable = document.createElement('span')
    // node.style.display = 'inline-block'
    node.name = name
    node.status = status
    node.details = details
    node.children = children
    node.level = level
    node.parent = parent.name || 'top'
    node.style.paddingLeft = (level - 1) * 3 + '%'
    node.hideChild = false
    node.hiddenChildren = [] // todo
    node.archived = false
    node.dueTime = false // todo
    node.dueDate = false // todo
    node.reminderTime = false // todo
    clickable.innerText = !document.debug ? name : debugStatement(node)
    node.appendChild(clickable)
    node.clickable = clickable
    clickable.onclick = (evt) => {
        evt.stopPropagation()
        if (evt.ctrlKey && document.selected.includes(node)) { // ctrl + unclick
            document.selected = document.selected.filter(feature => feature != node)
            node.style.fontWeight = 'normal'
        } else if (evt.ctrlKey) { // ctrl + click
            document.selected.push(node)
            node.style.fontWeight = 'bold'
        } else { // click
            document.selected.forEach(issue =>
                issue.style.fontWeight = 'normal'
            )
            document.selected = [node]
        }
        select()
        // console.log(document.selected.map(feature => feature.name))
    }
    clickable.ondblclick = (evt) => {
        evt.stopPropagation()
        if (node.hideChild) { // children are already hidden
            node.hiddenChildren.forEach(child => {
                child.level = node.level + child.level
                child.style.paddingLeft = (node.level) * 3 + '%'
                node.insertAdjacentElement('afterend', child)
            })
            node.hiddenChildren = []
            node.hideChild = false
        } else { // children are currently visible
            let childrenFound = false
            findChildren(node).forEach(child => {
                childrenFound = true
                // child.style.display = node.hideChild ? 'block' : 'none'
                node.hiddenChildren.unshift(child)
                tracker.removeChild(child)
                child.level = child.level - node.level
            })
            node.hideChild = childrenFound ? !node.hideChild : node.hideChild
        }
        node.style.fontStyle = node.hideChild ? 'italic' : 'normal'
    }
    printStatusColor(node, status)
    if (level === 1) {
        parent.append(node)
    } else {
        parent.insertAdjacentElement('afterend', node)
    }
    children.forEach(child => {
        print(child, node, level + 1)
    })
    return node
}

var add = function () {
    let parent = document.selected[0] ? document.selected[0] : tracker
    let level = document.selected[0] ? document.selected[0].level + 1 : 1
    console.log(parent, level)
    document.selected.forEach(feature => {
        feature.style.fontWeight = 'normal'
    })
    let node = print({
        'name': 'new feature',
        'status': 'todo',
        'details': '',
        'children': []
    }, parent, level)
    document.selected[0] && updateParent(node)
    document.selected = [node]
    save()
    select()
}

var archive = function () { // todo
    document.selected.for()
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
    refreshActives()
}

var refreshActives = () => {
    let activeFeatures = new Array(...tracker.childNodes)
    while (activeList.firstChild) {
        activeList.removeChild(activeList.firstChild)
    }
    let generateActives = () => {
        activeFeatures = activeFeatures.filter(feature => feature.status == 'active')
        activeFeatures.forEach(feature => {
            let item = document.createElement('li')
            item.innerText = feature.name
            activeList.append(item)
        })
    }
    !hideActive && generateActives()
}

nameEditor.onchange = () => {
    document.selected.forEach(feature => {
        feature.name = this.value
        feature.clickable.innerText = !document.debug ? this.value : debugStatement(feature)
        findChildren(feature).forEach(child => {
            child.parent = feature.name
            document.debug && (child.clickable.innerText = debugStatement(child))
        })
    })
    save()
}

detailEditor.onchange = function () {
    document.selected.forEach(node => {
        node.details = this.value
    })
    save()
}



var updateParent = (feature) => {
    if (feature.parent != 'top') {
        let parentStatus
        if (findSiblings(feature).every(sibling => sibling.status == 'done')) {
            parentStatus = 'done'
        } else {
            parentStatus = 'todo'
        }
        let parent = findParent(feature)
        parent.status = parentStatus
        printStatusColor(parent, parentStatus)
    }
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
    let queue
    let json = data
    let activeSession = {
        features: [],
        title: title.innerText,
    }
    const exportNode = (node) => {
        return {
            name: node.name,
            status: node.status,
            details: node.details,
            dueDate: node.dueDate,
            dueTime: node.dueTime,
            reminderTime: node.reminderTime,
            archived: node.archived,
            children: []
        }
    }

    let addToSaveQueue = (node) => {
        if (node.level < queue.length) { // if level has dropped
            let difference = queue.length - node.level
            for (let i = 0; i < difference; i++) {
                let collapse = queue.pop().reverse()
                queue.slice(-1)[0].slice(-1)[0].children.push(...collapse)
            }
            queue.slice(-1)[0].push(exportNode(node))
        } else if (node.level === queue.length) { // if same level
            queue.slice(-1)[0].push(exportNode(node))
        } else if (node.level > queue.length) { // if level has increased
            queue.push([exportNode(node)])
        }
    }

    // export current session
    queue = []

    tracker.childNodes.forEach(node => {
        addToSaveQueue(node)
        node.hiddenChildren.forEach(child => {
            child.level = node.level + child.level
            addToSaveQueue(child)
        })
    })

    for (let i = 1; i < queue.length; i++) {
        let collapse = queue.pop().reverse()
        queue.slice(-1)[0].slice(-1)[0].children.push(...collapse)
    }
    queue.forEach(feature => {
        activeSession.features.push(...feature)
    })
    json.sessions.unshift(activeSession)
    json = JSON.stringify(json)
    document.cookie = 'save=' + json
    localStorage.setItem('save', json)
    exportFile = json
    data = json
}

var checkConsecutive = (array) => {
    return Math.max(array) - Math.min(array) === array.length - 1
}

var findChildren = (feature) => {
    let children = []
    let temp = feature
    while (temp.nextSibling && temp.nextSibling.level > feature.level) {
        children.push(temp.nextSibling)
        temp = temp.nextSibling
    }
    return children
}

var findParent = (feature) => {
    let temp = feature
    while (temp.previousSibling) {
        console.log(feature.previousSibling.level, feature.level)
        if (temp.previousSibling.level >= feature.level) {
            temp = temp.previousSibling
        } else {
            return temp.previousSibling
        }
    }
    return null
}

var findSiblings = (feature) => {
    return findChildren(findParent(feature))
}

document.getElementById('selectnone').onclick = (evt) => {
    evt.stopPropagation()
    document.selected.forEach(feature => {
        feature.style.fontWeight = 'normal'
    })
    document.selected = []
    select(true)
}

var changeStatus = (newStatus) => {
    newStatus = newStatus || statusEditor.value
    document.selected.forEach(feature => {
        printStatusColor(feature, newStatus)
        feature.status = newStatus
        if (newStatus == 'done' && hideDone) {
            feature.style.display = 'none'
        }
        updateParent(feature)
        document.debug && (feature.clickable.innerText = debugStatement(feature))
    })
    select()
    save()
}

statusEditor.onchange = () => changeStatus()

document.getElementById('moveup').onclick = (evt) => {
    evt.stopPropagation()
    // check if consecutive
    let features = new Array(...tracker.childNodes)
    let indicies = document.selected.map(feature => features.indexOf(feature))
    let firstElement = tracker.childNodes[Math.min(indicies)]
    let lastElement = tracker.childNodes[Math.max(indicies)]
    if (checkConsecutive(indicies) && firstElement.previousSibling) {
        lastElement.insertAdjacentElement('afterEnd', firstElement.previousSibling)
        firstElement.previousSibling.level = (firstElement.previousSibling.level - lastElement.level > 1)
            ? lastElement.level + 1
            : firstElement.previousSibling.level
        firstElement.level = firstElement.previousSibling.level
        // TODO: figure out levels
    } else if (document.selected.map(feature => feature.previousSibling).every(Boolean)) {
        document.selected.forEach(feature => {
            previousFeature = feature.previousSibling
            feature.level = next.level
            previousFeature.insertAdjacentElement('beforeBegin', feature)
            feature.parent = findParent(feature)
        })
    } // must also move all children
    select()
    save()
}

document.getElementById('movedown').onclick = (evt) => {
    evt.stopPropagation()
    // check if consecutive
    let features = new Array(...tracker.childNodes)
    let indicies = document.selected.map(feature => features.indexOf(feature))
    let lastElement = tracker.childNodes[Math.max(indicies)]
    if (checkConsecutive(indicies) && lastElement.nextSibling) {
        let firstElement = tracker.childNodes[Math.min(indicies)]
        firstElement.insertAdjacentElement('beforeBegin', lastElement.nextSibling)
    }
    select()
    save()
}

document.getElementById('movein').onclick = (evt) => {
    evt.stopPropagation()
    let features = new Array(...tracker.childNodes)
    document.selected.sort(function (i, j) { return features.indexOf(i) - features.indexOf(j) }).forEach(feature => {
        console.log(debugStatement(feature.previousSibling))
        console.log(feature.previousSibling.level, feature.level, feature.previousSibling.level >= feature.level)
        if (feature.previousSibling.level >= feature.level) {
            feature.level += 1
            feature.style.paddingLeft = (feature.level - 1) * 3 + '%'
            feature.parent = findParent(feature).name
            console.log(feature.level)
            select()
        }
        document.debug && (feature.clickable.innerText = debugStatement(feature))
    })
    save()
}

document.getElementById('moveout').onclick = (evt) => {
    evt.stopPropagation()
    document.selected.forEach(feature => {
        if (feature.level > 1) {
            feature.level -= 1
            feature.style.paddingLeft = (feature.level - 1) * 3 + '%'
            feature.parent = findParent(feature) ? findParent(feature).name : 'top'
            select()
        }
        document.debug && (feature.clickable.innerText = debugStatement(feature))
    })
    save()
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
        feature.status = 'done'
        updateParent(feature)
        tracker.removeChild(feature)
    })
    document.selected = []
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

document.getElementById('active-button').onclick = () => {
    hideActive = !hideActive
    select(true)
}

document.getElementById('archive-button').onclick = () => {
    // toggleList('archive')
}

document.getElementById('hide-done').onclick = () => {
    let features = [...tracker.childNodes]
    features = features.filter(feature => feature.status == 'done')
    features.forEach(feature => {
        console.log(feature)
        feature.style.display = hideDone ? 'block' : 'none'
        findChildren(feature).forEach(child => {
            child.style.display = hideDone ? 'block' : 'none'
        })
    })
    document.getElementById('hide-done').className = hideDone ? 'button-primary' : ''
    hideDone = !hideDone
}

title.ondblclick = () => {
    let original = title
    let input = document.getElementById('title-input')
    input.value = original.innerText
    input.style.display = 'inline-block'
    original.style.display = 'none'
}

document.getElementById('title-input').onblur = () => {
    let original = title
    let input = document.getElementById('title-input')
    original.style.display = 'block'
    original.innerText = input.value
    input.style.display = 'none'
    save()
}


debugLevels = () => {
    tracker.childNodes.forEach(feature => {
        console.log(feature.level)
    })
}

var importJSON = (data) => {
    // title.innerText = data.title
    // data.features.forEach(feature => {
    //     print(feature, tracker, 1)
    // })
    let lastActiveSession = data.sessions.shift() // last active session is stored as first session
    title.innerText = lastActiveSession.title
    lastActiveSession.features.forEach(feature => {
        print(feature, tracker, 1)
    })
    let sessionTitles = data.sessions.map(session => session.title)
    sessionTitles.forEach(session => {
        let temp = document.createElement('option')
        sessionList.appendChild(temp)
    })
    return data
}

var findSaveFile = () => {
    if (localStorage.getItem('save')) { // use local storage api first
        data = JSON.parse(localStorage.getItem('save'))
        data = importJSON(data)
    } else if (document.cookie) { // use cookie next
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
    } else { // use default save file next
        fetch('./projectmap.json')
            .then(response => response.json(),
                () => alert('No save file found. Import or start fresh.'))
            .then(json => {
                data = json
                importJSON(data)
            })
    }
}

var clearList = () => {
    while (tracker.firstChild) {
        tracker.removeChild(tracker.firstChild)
    }
}

var debug = (state) => {
    document.debug = Boolean(state)
    clearList()
    findSaveFile()
    return document.debug
}

// session management

var createSession = () => {
    save()
}


// keyboard shortcuts

document.addEventListener('keyup', function (evt) {
    if (!document.selected.length || (document.activeElement.tagName == 'INPUT' || document.activeElement.tagName == 'TEXTAREA')) {
        return
    }
    switch (evt.key) {
        case 'd':
            changeStatus('done')
            break
        case 't':
            changeStatus('todo')
            break
        case 'p':
            changeStatus('paused')
            break
        case 'a':
            changeStatus('active')
            break
        default:
            break
    }
})

findSaveFile()
debug(true)
select(true)