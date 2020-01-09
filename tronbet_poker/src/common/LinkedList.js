const _ = require('lodash')._;
/************节点*************/
function Node(data) {
    this.data = data;//当前节点的数据  
    this.next = null;//下一个节点数据  
}

/*************************链表*****************************/
function LinkedList(data) {
    this.head = new Node(data);//头节点  
    this.head.next = this.head;//注意这里  
}
LinkedList.prototype = {
    //查找某一节点  
    find: function (cb) {
        if (cb == null || _.isFunction(cb) === false) return null;
        var currNode = this.head;
        while (currNode != null) {
            if (cb(currNode) === true) {
                return currNode;
            } else if (currNode.next == this.head) {
                return null;
            } else {
                currNode = currNode.next;
            }
        }
        return null;
    },
    findNextNode: function (node, cb) { //findFrom
        let currNode = null;
        if (node == null) {
            node = this.head;
            currNode = this.head;
        } else {
            currNode = node.next;
        }
        if (cb == null || _.isFunction(cb) === false) {
            if (currNode.next == node) {
                return null;
            } else {
                return currNode;
            }
        } else {
            while (currNode != null) {
                if (cb(currNode) === true) {
                    return currNode;
                } else if (currNode.next == node) {
                    return null;
                } else {
                    currNode = currNode.next;
                }
            }
            return null;
        }
    },
    findFromTo: function (start_node, end_node, cb) { //findFromTo
        let currNode = null;
        if (start_node == null || end_node == null) {
            start_node = this.head;
            currNode = this.head;
        } else {
            currNode = start_node.next;
        }
        if (cb == null || _.isFunction(cb) === false) return null;
        while (currNode != null) {
            if (currNode == end_node) {
                return null;
            } else if (cb(currNode) === true) {
                return currNode;
            } else {
                currNode = currNode.next;
            }
        }
        return null;
    },
    findAll: function (node, cb) { //findAll
        let currNode = null;
        if (node == null) {
            let _end = this.findLast();
            node = _end;
            currNode = _end.next;
        } else {
            currNode = node.next;
        }
        if (cb == null || _.isFunction(cb) === false) return null;
        while (currNode != null) {
            if (cb(currNode) === true) {
                return currNode;
            } else if (currNode == node) {
                return null;
            } else {
                currNode = currNode.next;
            }
        }
        return null;
    },
    findAllFromMe: function (node, cb) { //findAll
        if (node == null || cb == null || _.isFunction(cb) === false) return null;
        let preNode = this.findPrevious(node);
        return this.findAll(preNode, cb);
    },
    //查找尾节点  
    findLast: function () {
        var currNode = this.head;
        while (!(currNode.next == this.head)) {
            currNode = currNode.next;
        }
        return currNode;
    },
    //查找某一节点的前一个节点(前驱)  
    findPrevious: function (node) {
        node = node || this.head
        var currNode = node;
        while (currNode.next != null) {
            if (currNode.next == node) {
                return currNode;
            } else {
                currNode = currNode.next;
            }
        }
        return null;
    },
    //向某一元素后面插入新节点  
    insert: function (data, query) {
        var newNode = new Node(data);
        var current = this.find(query) || this.findLast();//默认插入到尾部  
        newNode.next = current.next;
        current.next = newNode;
    },
    //删除某一个节点  
    remove: function (query) {
        var prevNode = this.findPrevious(query);
        if (!(prevNode.next == this.head)) {//不能删除头  
            prevNode.next = prevNode.next.next;
        }
    },
    //修改某一节点的数据  
    edit: function (query, data) {
        var data = this.find(query);
        data.data = data;
    },
    //在控制台打印出所有节点(为了方便预览)  
    display: function () {
        console.log("----------------display--------------");
        var currNode = this.head;
        console.log(this.head.data);
        while (!(currNode.next == this.head)) {
            console.log(currNode.next.data);
            currNode = currNode.next;
        }
    }
}

module.exports = LinkedList;

/////////

// var lkk = new LinkedList({ seatNo: 0, balance: 0, position: "0", value: 0 });
// lkk.insert({ seatNo: 1, balance: 100, position: "1", value: 0, op: 3 });
// lkk.insert({ seatNo: 2, balance: 100, position: "2", value: 0, op: 3 });
// lkk.insert({ seatNo: 3, balance: 100, position: "3", value: 0, op: 3 });
// lkk.insert({ seatNo: 4, balance: 100, position: "4", value: 0, op: 3 });
// lkk.insert({ seatNo: 5, balance: 100, position: "5", value: 0, op: 3 });
// lkk.insert({ seatNo: 6, balance: 0, position: "6", value: 0, op: 3 });
// lkk.insert({ seatNo: 7, balance: 0, position: "7", value: 0, op: 4 });
// lkk.insert({ seatNo: 8, balance: 0, position: "8", value: 0, op: 3 });

// function test() {
//     let _start_node = null;
//     let _end_node = null;

//     _start_node = lkk.find((o) => {
//         return o.data.position === "3";
//     })

//     _end_node = lkk.find((o) => {
//         return o.data.position === "2";
//     })

//     console.log("------- findNextNode ------");
//     lkk.findNextNode(_start_node, (o) => {
//         console.log(o.data.position)
//     })

//     console.log("------- findFromTo ------");
//     lkk.findFromTo(_start_node, _end_node, (o) => {
//         console.log(o.data.position)
//     })

//     console.log("------- findAll ------");
//     lkk.findAll(_start_node, (o) => {
//         console.log(o.data.position)
//     })

//     console.log("------- findAllFromMe ------");
//     // let preNode = lkk.findAllFromMe(_start_node);
//     // console.log("------- from ------", preNode.data.position);
//     // lkk.findAll(preNode, (o) => {
//     //     console.log(o.data.position)
//     // })
//     lkk.findAllFromMe(_start_node, (o) => {
//         console.log(o.data.position)
//     })
// }

// test()