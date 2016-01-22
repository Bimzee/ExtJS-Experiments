/*

Ext Gantt 2.2.23
Copyright(c) 2009-2014 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**

@class Gnt.data.TaskStore
@extends Ext.data.TreeStore

A class representing the tree of tasks in the gantt chart. An individual task is represented as an instance of the {@link Gnt.model.Task} class. The store
expects the data loaded to be hierarchical. Each parent node should contain its children in a property called 'children' (please note that this is different from the old 1.x
version where the task store expected a flat data structure)

Parent tasks
------------

By default, when the start or end date of a task gets changed, its parent task(s) will optionally also be updated. Parent tasks always start at it earliest child and ends
at the end date of its latest child. So be prepared to see several updates and possibly several requests to server. You can batch them with the {@link Ext.data.proxy.Proxy#batchActions} configuration
option.

Overall, this behavior can be controlled with the {@link #recalculateParents} configuration option (defaults to true).

Cascading
---------

In the similar way, when the start/end date of the task gets changed, gantt *can* update any dependent tasks, so they will start on the earliest date possible.
This behavior is called "cascading" and is enabled or disabled using the {@link #cascadeChanges} configuration option.

Integration notes
---------

When integrating the Gantt panel with your database, you should persist at least the following properties seen in the class diagram below.

{@img gantt/images/gantt-class-diagram.png}

The bottom 3 properties (`index`, `parentId`, `depth`) of the Task class stem from the {@link Ext.data.NodeInterface} and are required to place the tasks correctly in the tree structure.

If you store your data in a relational database, below is a suggested Task table definition:

{@img gantt/images/gantt-task-table.png}

 ...as well as a Dependency table definition:

{@img gantt/images/gantt-dependency-table.png}

The types for the fields doesn't have to be as seen above, it's merely a simple suggestion. You could for instance use 'string' or a UID as the type of the Id field.

Your server should respond with a hierarchical structure where parent nodes contain an array or their child nodes in a `children` property. If you don't have any local
sorters, defined on the task store, these child nodes should be sorted by their `index` property before the server responds.

When creating new task nodes or updating existing ones, the server should always respond with an array of the created/updated tasks. Each task should contain *all* fields.

*/
Ext.define('Gnt.data.TaskStore', {
    extend      : 'Ext.data.TreeStore',

    requires    : [
        'Gnt.model.Task',
        'Gnt.data.Calendar',
        'Gnt.data.DependencyStore',
        'Gnt.patches.Tree'
    ],

    mixins  : [
        'Sch.data.mixin.FilterableTreeStore',
        'Sch.data.mixin.EventStore'
    ],

    model                   : 'Gnt.model.Task',

    /**
     * @cfg {Gnt.data.Calendar} calendar A {@link Gnt.data.Calendar calendar} instance to use for this task store. **Should be loaded prior the task store**.
     * This option can be also specified as the configuration option for the gantt panel. If not provided, a default calendar, containig the weekends
     * only (no holidays) will be created.
     *
     */
    calendar                : null,

    /**
     * @cfg {Gnt.data.DependencyStore} dependencyStore A `Gnt.data.DependencyStore` instance with dependencies information.
     * This option can be also specified as a configuration option for the gantt panel.
     */
    dependencyStore         : null,


    /**
     * @cfg {Gnt.data.ResourceStore} resourceStore A `Gnt.data.ResourceStore` instance with resources information.
     * This option can be also specified as a configuration option for the gantt panel.
     */
    resourceStore           : null,

    /**
     * @cfg {Gnt.data.AssignmentStore} assignmentStore A `Gnt.data.AssignmentStore` instance with assignments information.
     * This option can be also specified as a configuration option for the gantt panel.
     */
    assignmentStore         : null,

    /**
     * @cfg {Boolean} weekendsAreWorkdays This option will be translated to the {@link Gnt.data.Calendar#weekendsAreWorkdays corresponding option} of the calendar.
     *
     */
    weekendsAreWorkdays     : false,

    /**
     * @cfg {Boolean} cascadeChanges A boolean flag indicating whether a change in some task should be propagated to its depended tasks. Defaults to `false`.
     * This option can be also specified as the configuration option for the gantt panel.
     */
    cascadeChanges          : false,

    /**
     * @cfg {Boolean} batchSync true to batch sync request for 500ms allowing cascade operations, or any other task change with side effects to be batched into one sync call. Defaults to true.
     */
    batchSync               : true,

    /**
     * @cfg {Boolean} recalculateParents A boolean flag indicating whether a change in some task should update its parent task. Defaults to `true`.
     * This option can be also specified as the configuration option for the gantt panel.
     */
    recalculateParents      : true,

    /**
     * @cfg {Boolean} skipWeekendsDuringDragDrop A boolean flag indicating whether a task should be moved to the next earliest available time if it falls on non-working time,
     * during move/resize/create operations. Defaults to `true`.
     * This option can be also specified as a configuration option for the Gantt panel.
     */
    skipWeekendsDuringDragDrop  : true,

    /**
    * @cfg {Number} cascadeDelay If you usually have deeply nested dependencies, it might be a good idea to add a small delay
    * to allow the modified record to be refreshed in the UI right away and then handle the cascading
    */
    cascadeDelay                : 0,

    /**
     * @cfg {Boolean} moveParentAsGroup Set to `true` to move parent task together with its children, as a group. Set to `false`
     * to move only parent task itself. Note, that to enable drag and drop for parent tasks, one need to use the
     * {@link Gnt.panel.Gantt#allowParentTaskMove} option.
     */
    moveParentAsGroup           : true,

    /**
     * @cfg {Boolean} enableDependenciesForParentTasks Set to `true` to process the dependencies from/to parent tasks as any other dependency.
     * Set to `false` to ignore such dependencies and not cascade changes by them.
     *
     * Currently, support for dependencies from/to parent task is limited. Only the "start-to-end" and "start-to-start" dependencies
     * are supported. Also, if some task has incoming dependency from usual task and parent task, sometimes the dependency from
     * parent task can be ignored.
     *
     * Note, that when enabling this option requires the {@link Gnt.data.DependencyStore#strictDependencyValidation} to be set to `true` as well.
     * Otherwise it will be possible to create indirect cyclic dependnecies, which will cause "infinite recursion" exception.
     */
    enableDependenciesForParentTasks : true,

    /**
    * @cfg {Number} availabilitySearchLimit Maximum number of days to search for calendars common availability.
    * Used in various task calculations requiring to respect working time.
    * In these cases system tries to account working time as intersection of assigned resources calendars and task calendar.
    * This config determine a range intersectin will be searched in.
    * For example in case of task end date calculation system will try to find calendars intersection between task start date
    * and task start date plus `availabilitySearchLimit` days.
    */
    availabilitySearchLimit     : 1825, //5*365

    cascading                   : false,
    isFillingRoot               : false,
    isSettingRoot               : false,

    earlyStartDates             : null,
    earlyEndDates               : null,
    lateStartDates              : null,
    lateEndDates                : null,

    lastTotalTimeSpan           : null,

    suspendAutoRecalculateParents : 0,
    suspendAutoCascade          : 0,

    currentCascadeBatch         : null,
    batchCascadeLevel           : 0,


    fillTasksWithDepInfoCounter : 0,

    fillTasksWithAssignmentInfoCounter : 0,

    /**
     * @cfg {String} dependenciesCalendar A string, defining the calendar, that will be used when calculating the working time, skipped
     * by the dependencies {@link Gnt.model.Dependency#lagField lag}. Default value is `project` meaning main project calendar is used.
     * Other recognized values are: `source` - the calendar of dependency's source task is used, `target` - the calendar of target task.
     */
    dependenciesCalendar        : 'project',

    cachedAssignments           : null,


    constructor : function (config) {
        this.addEvents(
            /**
             * Will be fired on the call to `filter` method
             * @event filter
             * @param {Gnt.data.TaskStore} self This task store
             * @param {Object} args The arguments passed to `filter` method
             */
            'filter',

            /**
             * Will be fired on the call to `clearFilter` method
             * @event clearfilter
             * @param {Gnt.data.TaskStore} self This task store
             * @param {Object} args The arguments passed to `clearFilter` method
             */
            'clearfilter',

            /**
            * @event beforecascade
            * Fires before a cascade operation is initiated
            * @param {Gnt.data.TaskStore} store The task store
            */
            'beforecascade',

            /**
            * @event cascade
            * Fires when after a cascade operation has completed
            * @param {Gnt.data.TaskStore} store The task store
            * @param {Object} context A context object revealing details of the cascade operation, such as 'nbrAffected' - how many tasks were affected.
            */
            'cascade'
        );

        config      = config || {};

        if (!config.calendar) {
            var calendarConfig  = {};

            if (config.hasOwnProperty('weekendsAreWorkdays')) {
                calendarConfig.weekendsAreWorkdays = config.weekendsAreWorkdays;
            } else {
                 if (this.self.prototype.hasOwnProperty('weekendsAreWorkdays') && this.self != Gnt.data.TaskStore) {
                    calendarConfig.weekendsAreWorkdays = this.weekendsAreWorkdays;
                 }
            }

            config.calendar     = new Gnt.data.Calendar(calendarConfig);
        }

        // If not provided, create default stores (which will be overridden by GanttPanel during instantiation
        var dependencyStore = config.dependencyStore || this.dependencyStore || Ext.create("Gnt.data.DependencyStore");
        delete config.dependencyStore;
        this.setDependencyStore(dependencyStore);

        var resourceStore = config.resourceStore || this.resourceStore || Ext.create("Gnt.data.ResourceStore");
        delete config.resourceStore;
        this.setResourceStore(resourceStore);

        var assignmentStore = config.assignmentStore || this.assignmentStore || Ext.create("Gnt.data.AssignmentStore", { resourceStore : resourceStore });
        delete config.assignmentStore;
        this.setAssignmentStore(assignmentStore);

        var calendar        = config.calendar;

        if (calendar) {
            delete config.calendar;

            this.setCalendar(calendar, true);
        }

        // init cache for early/late dates
        this.resetEarlyDates();
        this.resetLateDates();

        // Call this early manually to be able to add listeners before calling the superclass constructor
        this.mixins.observable.constructor.call(this);

        this.on({
            beforefill      : this.onRootBeforeFill,
            fillcomplete    : this.onRootFillEnd,
            remove          : this.onTaskDeleted,
            write           : this.onTaskStoreWrite,
            sort            : this.onSorted,
            load            : this.onTasksLoaded,
            rootchange      : this.onTasksLoaded,
            scope           : this
        });

        this.callParent([ config ]);

        this.fillTasksWithDepInfo();

        if (this.autoSync) {
            if (this.batchSync) {
                // Prevent operations with side effects to create lots of individual server requests
                this.sync = Ext.Function.createBuffered(this.sync, 500);
            } else {
                // Need some preprocessing in case store tries to persist a single phantom record with a phantom parent.
                this.on('beforesync', this.onTaskStoreBeforeSync, this);
            }
        }

        this.initTreeFiltering();

        // this is required to activate the "bulkremove" thing
        // the "removeAll" methods checks for "node.store.treeStore" property, probably assuming that all nodes
        // are "joined" the NodeStore first, so it will be in the "store" property
        // however nodes, can be joined TreeStore first (and then NodeStore), so "store" will reference a tree store itself
        this.treeStore      = this;
    },


    onTasksLoaded : function () {
        this.fillTasksWithDepInfoCounter    = 1;
        this.fillTasksWithAssignmentInfoCounter    = 1;

        this.fillTasksWithDepInfo();
        // note we don't have to fill tasks' assignments cache using `fillTasksWithAssignmentInfoCounter`
        // because it was filled during creatiion of the tree (fillNode) and normalization (normalize)
    },


    load : function (options) {
        // Overridden to avoid reacting to the removing of all the records in the store
        this.un("remove", this.onTaskDeleted, this);
        
        // Note, that gantt uses additional important override for `load` method for ExtJS 4.2.1 and below, inherited from
        // Sch.data.mixin.FilterableTreeStore

        this.callParent(arguments);

        this.on("remove", this.onTaskDeleted, this);
    },

    /**
     * Method for loading an existing dataset into the store.
     * @param {Gnt.model.Task[]/Object[]} data Data to be appended, either a JSON Array of objects or an array of task records.
     * @param {Object} append Object storing config options for loading data. If the 'addRecords' option set to true,
     * records will be added to the current data set. Otherwise all previous data will be erased before loading new records. 'syncStore' option
     * is responsible for syncing the store after the operation has finished. If not provided, all modified records will be marked as
     * non-dirty.
     * @param {Boolean} [append.addRecords=false]
     * @param {Boolean} [append.syncStore=false]
     */
    loadData: function (data, append) {
        var me         = this,
            root       = me.getRootNode(),
            addRecords = append ? append.addRecords : false,
            syncStore  = append ? append.syncStore : false;

        //suspend events to prevent multiple proxy calls
        me.suspendAutoSync();
        me.suspendEvents();

        //if append is false, remove all nodes from the store. Check for root added just in case.
        if (!addRecords && root) {
            root.removeAll();
        }

        if (!me.getRootNode()){
            root = me.setRootNode();
        }

        if (data.length){
            var length       = data.length,
                model        = me.model,
                nodesWithoutAddedParents = [],

                //check if node is a record, or simple object with data
                nodeIsRecord = (typeof data[0].get === "function"),

                //flag indicating if index or parent of node has changed
                parentUnchanged,
                node, nodeObj, dataParentId, nodeParentId, dataIndex, nodeIndex, parent, oldParent, skip;

            var nodesIds = me.sortNewNodesByIndex(data);

            for (var i = 0; i < length; i++) {
                node            = me.getById(data[i].getId ? data[i].getId() : data[i].Id);
                skip            = false;
                parentUnchanged = 0;

                //if node is found in the store, update data/parent, else create a new node
                if (node){
                    //get parentId of node and from data
                    dataParentId = nodeIsRecord ? data[i].get('parentId') : data[i].parentId;
                    nodeParentId = node.parentNode.getId();
                    dataIndex    = nodeIsRecord ? data[i].get('index') : data[i].index;
                    nodeIndex    = node.get('index');

                    //if parentId or index changed, append to new parent or at different position
                    if ((( typeof dataParentId !== 'undefined' || dataParentId === null) ? (dataParentId !== nodeParentId) : false) ||
                        (typeof dataIndex !== 'undefined' ? (dataIndex !== nodeIndex) : false)){

                        //if parentId is null, add to rootNode
                        parent    = dataParentId === null ? root : me.getById(dataParentId);
                        oldParent = nodeParentId === null ? root : me.getById(nodeParentId);

                        if (parent && (parent.get('parentId') === node.getId()) &&
                            me.selfChildInRecordsData(node.getId(), dataParentId, nodesIds)){
                            skip = true;
                        }
                    } else {
                        parentUnchanged = 1;
                    }
                } else {
                    node         = nodeIsRecord ? new model(data[i].data) : new model(data[i]);
                    nodeParentId = node.get('parentId');

                    if (nodeParentId){
                        parent = me.getById(nodeParentId);
                    } else if ( nodeParentId === null){
                        parent = root;
                    }
                }

                //set node's values to either record's data or object properties
                if (!skip){
                    if (nodeIsRecord) {
                        node.set(data[i].data);
                    } else {
                        node.set(data[i]);
                    }
                } else {
                    continue;
                }

                //if parent node is already in the tree, add node to parent's children. Otherwise push it to temp array.
                if (parent && !parentUnchanged) {
                    me.moveChildren(node, parent, oldParent, nodesIds);
                    me.fixNodeDates(node);
                } else if(typeof parent === 'undefined' && !parentUnchanged){
                    //we need to store values of index and parentId, because appending nodes on the same
                    //level will overwrite the current values
                    nodeObj = {
                        node: node,
                        index: node.get('index') || 0,
                        parentId: node.get('parentId')
                    };
                    nodesWithoutAddedParents.push(nodeObj);
                } else {
                    me.fixNodeDates(node);
                }

                //if store is not to be synced, mark modified nodes as non-dirty
                if (parent && !syncStore){
                    parent.commit();
                    node.commit();

                    if (oldParent) oldParent.commit();
                }
            }

            var cursor        = 0,
                //force one full round over nodesWithoutAddedParents array
                fullRound     = 0,
                initialLength = nodesWithoutAddedParents.length,
                currentNodeObj,
                parentNode;

            //traverse array of nodes without parents, removing added nodes until it's length is equal to 0
            while (nodesWithoutAddedParents.length){
                if (cursor > nodesWithoutAddedParents.length - 1) {
                    cursor = 0;
                    fullRound = 1;
                }

                currentNodeObj = nodesWithoutAddedParents[cursor];
                parentNode     = currentNodeObj.parentId === null ? root : me.getById(currentNodeObj.parentId);

                if (parentNode) {
                    var notSelfChild = me.nodeIsChild(currentNodeObj.node, parent);

                    if (notSelfChild){
                        parentNode.insertChild(currentNodeObj.index, currentNodeObj.node);
                        me.fixNodeDates(currentNodeObj.node);
                        nodesWithoutAddedParents.splice(cursor, 1);

                        if (!syncStore){
                            parentNode.commit();
                            currentNodeObj.node.commit();
                        }

                        cursor -= 1;
                    }
                }

                cursor += 1;

                //check if it's possible to resolve parent/child dependencies, avoid recursive dependencies.
                if (fullRound && cursor === initialLength-1 && nodesWithoutAddedParents.length === initialLength){
                    throw 'Invalid data, possible infinite loop.';
                }
            }

            //restore expanded flag for nodes
            if (me.nodesToExpand){
                i=0;
                for (var l = me.nodesToExpand.length; i < l; i += 1){
                    node = me.nodesToExpand[i];

                    //we can't expand node without children as it throws errors
                    if (node.childNodes && node.childNodes.length){
                        node.expand();
                    }
                }
                delete me.nodesToExpand;
            }
        }

        //resume store's events and sync with proxy
        me.resumeAutoSync();
        me.resumeEvents();

        this.fireEvent('datachanged');
        this.fireEvent('refresh');

        if (syncStore){
            me.sync();
        }

        //Buffered store not yet supported
        if (this.buffered){
            //this.updateBufferedNodeStore();
        }
    },

    //internal function for checking if child node is in the loaded data and has parentId different then node id
    selfChildInRecordsData : function(parentId, childId, nodesIds){
        var ret = false;

        ret = typeof nodesIds[childId] === 'undefined' ? true : nodesIds[childId] === parentId;

        return ret;
    },

    //sort loaded data by parent id and index
    sortNewNodesByIndex: function(nodesArray){
        var nodesIds = {},
            getParam = function(obj, param){
                if (typeof obj.get === "function"){
                    return obj.get(param);
                }
                return obj[param];
            };

        Ext.Array.each(nodesArray, function(node){
            nodesIds[getParam(node, 'Id')] = getParam(node, 'parentId');
        });

        Ext.Array.sort(nodesArray, function(nodeObjA, nodeObjB){
            var idxA = getParam(nodeObjA, 'index'),
                idxB = getParam(nodeObjB, 'index'),
                pIdA = getParam(nodeObjA, 'parentId'),
                pIdB = getParam(nodeObjB, 'parentId');

            if (typeof idxA !== 'undefined' && typeof idxB !== 'undefined'){

                //sort by parentId's
                if(pIdA === pIdB){
                    return (idxA < idxB) ? -1 : (idxA > idxB) ? 1 : 0;
                } else {
                    if (pIdA === null){
                        return 1;
                    } else if (pIdB === null){
                        return -1;
                    } else {
                        return (pIdA < pIdB) ? -1 : 1;
                    }
                }
            }
            return 0;
        });

        return nodesIds;
    },

    //internal function. Recalculate duration and start/end dates of node parent and node itself if it has children
    fixNodeDates: function (node) {
        var duration = node.calculateDuration(node.getStartDate(), node.getEndDate(), node.getDurationUnit()),
            childNode;

        node.set({
            Duration: duration
        });

        if (this.recalculateParents){
            if (node.childNodes.length){
                childNode = node.getChildAt(0);
                childNode.recalculateParents();
            } else {
                node.recalculateParents();
            }
        }
    },

    //internal function. Compares id of newParent with id's of each child node to prevent adding node as a child of it's child
    nodeIsChild: function (node, newParent) {
        var id = newParent.getId(),
            ret = true;

        //if node has any child nodes
        if (node.childNodes.length){
            node.cascadeBy(function(n){
                if (n.getId() === id){
                    ret = false;
                    return false;
                }
            });
        }

        return ret;
    },

    /* @private
     * Method for moving node with all of it's children to a different parent node.
     * @param {Gnt.model.Task} node Task to be moved.
     * @param {Gnt.model.Task} newParent New parent for the Task.
     * @param {Gnt.model.Task} parent (optional) Current parent of the node.
     * If not defined, it'll be derived from Task's
     * ### FIX THIS WHEN YOU MAKE IT PUBLIC OR DOCUMENTED
     * {Gnt.model.Task#cfg-parentId parentId}
     * ###
     * @param {Object} nodesIds (optional) Object with id's of nodes and their parents
     */
    moveChildren: function (node, newParent, parent, nodesIds) {
        //adding expanded node returns an error if the node has no children
        if (node.get('expanded')){
            if (!this.nodesToExpand){
                this.nodesToExpand = [];
            }
            this.nodesToExpand.push(node);
            node.set('expanded', false);
        }

        var copyNode,

            //check if we're not trying to add node as a child node of current child
            notSelfChild = this.nodeIsChild(node, newParent),
            notSelfChildInData = nodesIds ? !this.selfChildInRecordsData(node.getId(), newParent.getId(), nodesIds) : true,
            oldParent = parent || this.getById(node.get('parentId'));

        if (!notSelfChild && notSelfChildInData){
            newParent.set('parentId', null);
            this.moveChildren(newParent, this.getRootNode(), node);
        }

        if (notSelfChild || notSelfChildInData){
            //TODO Find a better way of moving parts of the tree
            //if node has children, do a deep copy of it and remove children from the original
            if(node.childNodes.length){
                copyNode = node.copy(null, true);
                node.removeAll();
            }
            if (oldParent && oldParent.getId() !== newParent.getId()){
                oldParent.removeChild(node);
            }

            typeof node.get('index') !== 'undefined' ? newParent.insertChild(node.get('index'), node) : newParent.appendChild(node);

            if(copyNode){
                //if node had any children, create a shallow copy and append it to the parent again
                copyNode.cascadeBy(function(n){
                    if(n !== copyNode){
                        var cp = n.copy(null);
                        cp.get('index') ? node.insertChild(cp.get('index'), cp) : node.appendChild(cp);
                    }
                });
            }

            this.fixNodeDates(node);
        }
    },

    setRootNode : function () {
        var me                  = this;

        // this flag will prevent the "autoTimeSpan" feature from reacting on individual "append" events, which happens a lot
        // before the "rootchange" event
        this.isSettingRoot      = true;

        this.tree.setRootNode   = Ext.Function.createInterceptor(this.tree.setRootNode, function (rootNode) {

            Ext.apply(rootNode, {
                calendar            : me.calendar,
                taskStore           : me,
                dependencyStore     : me.dependencyStore,

                // HACK Prevent tree store from trying to 'create' the root node
                phantom             : false,
                dirty               : false
            });
        });

        var res                 = this.callParent(arguments);

        this.isSettingRoot      = false;

        delete this.tree.setRootNode;

        return res;
    },


    onRootBeforeFill : function (me, node) {
        // We have task normalization step that calculates missing data like duration based on effort etc.
        // Some of that data is based on assignments information (effort).
        // Because of that we need to have correct state of assignments cache before `normalize`
        // "normalize" happens inside of fillNode, so `fillAssignmentsCache` should be called before the moment when `fillNode`
        // starts tree construction
        // this event seems the only place where to do it (the other way would be to override the `fillNode` method)
        if (node.isRoot()) {
            this.cachedAssignments = this.fillAssignmentsCache();
        }

        // this is not quite correct since "beforefill" can be fired when filling
        // any node (it seems)
        // but usually (when not using on-demand tree loading) only the root node will be filled
        // we only need this "isFillingRoot" flag in some overrides in Task model
        this.isFillingRoot  = true;

        this.un({
            append      : this.onNodeUpdated,
            insert      : this.onNodeUpdated,

            update      : this.onTaskUpdated,

            scope       : this
        });
    },


    onRootFillEnd : function (me, root) {
        if (root.isRoot()) {
            this.cachedAssignments = null;
        }

        root.normalizeParent();

        this.on({
            append      : this.onNodeUpdated,
            insert      : this.onNodeUpdated,

            update      : this.onTaskUpdated,

            scope       : this
        });

        this.isFillingRoot  = false;

        // workaround for #1230
        // see also http://www.sencha.com/forum/showthread.php?270808-4.2.1-4.2.2-TreeStore-duplicates-nodes-during-quot-appendChild-quot&p=992286#post992286
        // remove after Ext bug will be fixed
        // the nodes are duplicated in "onNodeAdded" method which for some reason tries to extract the data from
        // already created node
        // "lazyFill" flag prevents the store from going into that branch
        if (Ext.data.reader.Xml && this.proxy.reader instanceof Ext.data.reader.Xml) this.lazyFill = true;
    },


    /**
     * Returns a dependecy store instance this task store is associated with. See also {@link #setDependencyStore}.
     *
     * @return {Gnt.data.DependencyStore}
     */
    getDependencyStore : function () {
        return this.dependencyStore;
    },


    fillTasksWithDepInfo : function () {
        // no tasks yet - internal tree is not ready
        if (!this.tree || !this.tree.nodeHash) return;

        var dependencyStore   = this.getDependencyStore();

        // do not iterate for the 1st call - since tasks already has these arrays set in the constructor
        if (this.fillTasksWithDepInfoCounter++ > 0) {
            this.forEachTaskUnOrdered(function (task) {
                task.successors     = [];
                task.predecessors   = [];
            });
        }

        if (dependencyStore) {
            dependencyStore.each(function (dependency) {
                var from    = dependency.getSourceTask(),
                    to      = dependency.getTargetTask();

                if (from && to) {
                    from.successors.push(dependency);
                    to.predecessors.push(dependency);
                }
            });
        }
    },


    /**
     * Sets the dependency store for this task store
     *
     * @param {Gnt.data.DependencyStore} dependencyStore
     */
    setDependencyStore : function (dependencyStore) {
        var listeners       = {
            add         : this.onDependencyAddOrUpdate,
            update      : this.onDependencyAddOrUpdate,
            remove      : this.onDependencyDelete,

            scope       : this
        };

        if (this.dependencyStore) {
            this.dependencyStore.un(listeners);
        }

        if (dependencyStore) {
            this.dependencyStore    = Ext.StoreMgr.lookup(dependencyStore);

            if (dependencyStore) {
                dependencyStore.taskStore   = this;

                dependencyStore.on(listeners);

                this.fillTasksWithDepInfo();
            }
        } else {
            this.dependencyStore    = null;
        }
    },

    /**
     * Sets the resource store for this task store
     *
     * @param {Gnt.data.ResourceStore} resourceStore
     */
    setResourceStore : function (resourceStore) {

        if (resourceStore) {
            this.resourceStore    = Ext.StoreMgr.lookup(resourceStore);

            resourceStore.taskStore = this;

            resourceStore.normalizeResources();
        } else {
            this.resourceStore    = null;
        }
    },


    /**
     * Returns a resource store instance this task store is associated with. See also {@link #setResourceStore}.
     *
     * @return {Gnt.data.ResourceStore}
     */
    getResourceStore : function(){
        return this.resourceStore || null;
    },


    fillAssignmentsCache        : function () {
        var assignmentStore     = this.getAssignmentStore(),
            cache               = {};

        // do not iterate for the 1st call - since tasks already has these arrays set in the constructor
        if (this.fillTasksWithAssignmentInfoCounter++ > 0) {
            this.forEachTaskUnOrdered(function (task) {
                task.assignments = [];
            });
        }

        if (assignmentStore) {
            assignmentStore.each(function (assignment) {
                var id  = assignment.getTaskId();
                cache[id] ? cache[id].push(assignment) : cache[id] = [assignment];
            });
        }

        return cache;
    },

    fillTasksWithAssignmentInfo : function () {
        // no tasks yet - internal tree is not ready
        if (!this.tree || !this.tree.nodeHash) return;

        var assignmentStore   = this.getAssignmentStore();

        // do not iterate for the 1st call - since tasks already has these arrays set in the constructor
        if (this.fillTasksWithAssignmentInfoCounter++ > 0) {
            this.forEachTaskUnOrdered(function (task) {
                task.assignments = [];
            });
        }

        if (assignmentStore) {
            assignmentStore.each(function (assignment) {
                var task = assignment.getTask();
                task && task.assignments.push(assignment);
            });
        }
    },

    /**
     * Sets the assignment store for this task store
     *
     * @param {Gnt.data.AssignmentStore} assignmentStore
     */
    setAssignmentStore : function (assignmentStore) {
        var listeners       = {
            add         : this.onAssignmentStructureMutation,
            update      : this.onAssignmentMutation,
            remove      : this.onAssignmentStructureMutation,

            scope       : this
        };

        if (this.assignmentStore) {
            this.assignmentStore.un(listeners);
        }

        if (assignmentStore) {
            this.assignmentStore    = Ext.StoreMgr.lookup(assignmentStore);

            assignmentStore.taskStore = this;

            assignmentStore.on(listeners);

            this.fillTasksWithAssignmentInfo();
        } else {
            this.assignmentStore = null;
        }
    },


    /**
     * Returns an assignment store this task store is associated with. See also {@link #setAssignmentStore}.
     *
     * @return {Gnt.data.AssignmentStore}
     */
    getAssignmentStore : function(){
        return this.assignmentStore || null;
    },


    /**
     * Call this method if you want to adjust the tasks according to the calendar dates.
     */
    renormalizeTasks : function (store, nodes) {
        // reset early/late dates cache
        this.resetEarlyDates();
        this.resetLateDates();

        if (nodes instanceof Gnt.model.Task) {
            nodes.adjustToCalendar();
        } else {
            // Root may not yet exist if task store hasn't been loaded yet (and not used with a tree view)
            var root = this.getRootNode();

            if (root) {
                // Process all
                root.cascadeBy(function(node) {
                    node.adjustToCalendar();
                });
            }
        }
    },

    /**
     * Returns a project calendar instance.
     *
     * @return {Gnt.data.Calendar}
     */
    getCalendar: function(){
        return this.calendar || null;
    },


    /**
     * Sets the calendar for this task store
     *
     * @param {Gnt.data.Calendar} calendar
     */
    setCalendar : function (calendar, doNotChangeTasks) {
        var listeners = {
            calendarchange      : this.renormalizeTasks,

            scope               : this
        };

        if (this.calendar) {
            this.calendar.un(listeners);
        }

        this.calendar           = calendar;

        if (calendar) {
            calendar.on(listeners);

            var root                = this.tree && this.getRootNode();

            if (root) {
                root.calendar       = calendar;
            }

            if (!doNotChangeTasks) this.renormalizeTasks();
        }
    },


    /**
    * Returns the critical path(s) that can affect the end date of the project
    * @return {Array} paths An array of arrays (containing task chains)
    */
    getCriticalPaths: function () {
        // Grab task id's that don't have any "incoming" dependencies
        var root                = this.getRootNode(),
            finalTasks          = [],
            lastTaskEndDate     = new Date(0);

        // find the project end date
        root.cascadeBy(function (task) {
            lastTaskEndDate = Sch.util.Date.max(task.getEndDate(), lastTaskEndDate);
        });

        // find the tasks that ends on that date
        root.cascadeBy(function (task) {
            //                                                              do not include the parent tasks that has children
            //                                                              since their influence on the project end date is determined by its children
            if (lastTaskEndDate - task.getEndDate() === 0 && !task.isRoot() && !(!task.isLeaf() && task.childNodes.length)) {
                finalTasks.push(task);
            }
        });

        var cPaths  = [];

        Ext.each(finalTasks, function (task) {
            cPaths.push(task.getCriticalPaths());
        });

        return cPaths;
    },

    onNodeUpdated : function (parent, node) {
        if (!node.isRoot()) {
            if (this.lastTotalTimeSpan) {
                var span = this.getTotalTimeSpan();

                // if new task dates violates cached total range then let's reset getTotalTimeSpan() cache
                if (node.getEndDate() > span.end || node.getStartDate() < span.start) {
                    this.lastTotalTimeSpan = null;
                }
            }

            // if it's a latest task
            if (node.getEndDate() - this.getProjectEndDate() === 0) {
                this.resetLateDates();
            }

            if (!this.cascading && this.recalculateParents) {
                node.recalculateParents();
            }
        }
    },

    getViolatedConstraints : function (limit) {
        var me          = this,
            count       = 0,
            errors      = [];

        this.dependencyStore.each(function (dependency) {
            var from    = dependency.getSourceTask();
            var to      = dependency.getTargetTask();

            if (from && to) {
                var error = to.getViolatedConstraints();
                if (error) {
                    count++;
                    errors.push(error);
                }

                if (limit && (count >= limit)) return false;
            }
        });

        return errors;
    },

    onTaskUpdated : function (store, task, operation) {
        var prev = task.previous;

        if (this.lastTotalTimeSpan) {
            var span = this.getTotalTimeSpan();

            // if new task dates violates cached total range then let's reset the cache
            if (prev && (prev[ task.endDateField ] - span.end === 0 || prev[ task.startDateField ] - span.start === 0) ||
                (task.getEndDate() > span.end || task.getStartDate() < span.start))
            {
                this.lastTotalTimeSpan = null;
            }
        }

        if (!this.cascading && operation !== Ext.data.Model.COMMIT && prev) {

            var doRecalcParents = task.percentDoneField in prev;

            // Check if we should cascade this update to successors
            // We're only interested in cascading operations that affect the start/end dates
            if (task.startDateField in prev ||
                task.endDateField in prev   ||
                'parentId' in prev          ||
                task.effortField in prev    ||
                prev[ task.schedulingModeField ] === 'Manual')
            {

                var cascadeSourceTask = task;

                if (this.cascadeChanges && !this.suspendAutoCascade) {
                    // if we switched scheduling mode from manual then we'll call cascadeChangesForTask() for some of
                    // task predecessors (if any) to update task itself
                    if (prev[ cascadeSourceTask.schedulingModeField ] == 'Manual') {
                        var deps = cascadeSourceTask.getIncomingDependencies(true);

                        if (deps.length) {
                            cascadeSourceTask = deps[ 0 ].getSourceTask();
                        }
                    }

                    Ext.Function.defer(this.cascadeChangesForTask, this.cascadeDelay, this, [ cascadeSourceTask ]);
                } else {
                    // reset early/late dates cache
                    this.resetEarlyDates();
                    this.resetLateDates();
                }

                doRecalcParents = true;

            // if task scheduling turned to manual
            } else if (prev[ task.schedulingModeField ] && task.isManuallyScheduled()) {
                // reset early/late dates cache
                this.resetEarlyDates();
                this.resetLateDates();
            }

            if (doRecalcParents && this.recalculateParents && !this.suspendAutoRecalculateParents) {
                task.recalculateParents();
            }
        }
    },


    // starts a `batched` cascade (can contain several cascades, combined in one `currentCascadeBatch` context
    // cascade batch may actually contain 0 cascades (if for example deps are invalid)
    startBatchCascade : function () {
        if (!this.batchCascadeLevel) {
            this.currentCascadeBatch    = {
                nbrAffected         : 0,
                affected            : {},

                visitedCounters     : {},

                addVisited          : function (task) {
                    var internalId      = task.internalId;

                    if (!this.visitedCounters[ internalId ]) {
                        this.visitedCounters[ internalId ]     = 1;
                    } else {
                        this.visitedCounters[ internalId ]++;
                    }
                },

                addAffected         : function (task) {
                    var internalId      = task.internalId;

                    if (!this.affected[ internalId ]) {
                        this.affected[ internalId ]            = task;
                        this.nbrAffected++;
                    }
                }
            };
        }

        this.batchCascadeLevel++;

        return this.currentCascadeBatch;
    },


    endBatchCascade : function () {
        this.batchCascadeLevel--;

        if (!this.batchCascadeLevel) {
            var currentCascadeBatch     = this.currentCascadeBatch;
            this.currentCascadeBatch    = null;

            this.resetEarlyDates();
            this.resetLateDates();

            if (this.cascading) {
                this.cascading              = false;
                this.fireEvent('cascade', this, currentCascadeBatch);
            }
        }
    },


    /**
     * Cascade the updates to the depended tasks of given `task` (re-schedule them as soon as possible).
     *
     * @param {Gnt.model.Task} task
     */
    cascadeChangesForTask : function (sourceTask, doNotRecalculateParents) {
        var currentCascadeBatch     = this.currentCascadeBatch;

        if (currentCascadeBatch && currentCascadeBatch.visitedCounters[ sourceTask.internalId ] > sourceTask.predecessors.length) {
            return { nbrAffected : 0, affected : {} };
        }

        this.startBatchCascade();

        var me              = this,
            context         = { nbrAffected : 0, affected : {} };

//        // go breadth
//        currentCascadeBatch         = this.currentCascadeBatch;
//
//        var queue           = sourceTask.getSuccessors();
//
//        while (queue.length) {
//            var task        = queue.shift()
//
//            if (currentCascadeBatch.visitedCounters[ task.internalId ] > task.predecessors.length) continue;
//
//            currentCascadeBatch.addVisited(task);
//
//            if (!task.isManuallyScheduled() && (task.isLeaf() || me.enableDependenciesForParentTasks)) {
//                if (!me.cascading) {
//                    // even that the task may not have changed in the following constrain
//                    // we need to fire the "beforecascade" event here, otherwise `constrain` may cause
//                    // several updates and that will be not efficient
//                    me.fireEvent('beforecascade', me);
//                    me.cascading = true;
//                }
//
//                var changed     = task.constrain(me);
//
//                if (changed) {
//                    // update local context
//                    context.nbrAffected++;
//                    context.affected[ task.internalId ] = task;
//
//                    // update batch context
//                    currentCascadeBatch.addAffected(this);
//
//                    queue.push.apply(queue, task.getSuccessors())
//                }
//            }
//        }
//        // eof go breadth

        // go deep
        Ext.each(sourceTask.getOutgoingDependencies(true), function (dependency) {
            var dependentTask = dependency.getTargetTask();

            if (dependentTask) {
                if (!me.cascading) {
                    me.fireEvent('beforecascade', me);
                    me.cascading = true;
                }

                dependentTask.cascadeChanges(me, context, dependency);
            }
        });
        // eof go deep

        if (me.cascading) {
            if (!doNotRecalculateParents && me.recalculateParents) me.recalculateAffectedParents(context.affected);
        }

        this.endBatchCascade();

        return context;
    },


    // context object, containing list of parent task, along with the index by "internalId"
    getParentsContext : function () {
        return {
            array           : [],
            byInternalId    : {}
        };
    },


    // adds a task to the context returned by `getParentsContext`, keeping the following contract:
    // if some task is in context, then all its parent tasks should be in context too
    addTaskToParentsContext : function (parentsContext, task) {
        var byId        = parentsContext.byInternalId;
        var array       = parentsContext.array;
        var parent      = task.isLeaf() ? task.parentNode : task;

        while (parent) {
            if (byId[ parent.internalId ]) break;

            byId[ parent.internalId ] = parent;
            array.push(parent);

            parent      = parent.parentNode;
        }
    },


    recalculateAffectedParents : function (affectedTasksByInternalId, parentsContext) {
        parentsContext      = parentsContext || this.getParentsContext();

        this.suspendAutoCascade++;
        this.suspendAutoRecalculateParents++;

        var me              = this;

        Ext.Object.each(affectedTasksByInternalId, function (internalId, task) {
            me.addTaskToParentsContext(parentsContext, task);
        });

        var array           = parentsContext.array;

        array.sort(function (a, b) {
            return a.data.depth - b.data.depth;
        });

        var i;

        if (this.recalculateParents) {
            // refreshing the parent tasks starting from the deep-most ones - that critical for correct calculations
            for (i = array.length - 1; i >= 0; i--) array[ i ].refreshCalculatedParentNodeData();
        }

        if (this.cascadeChanges) {
            // cascading from top-most ones in the hope that they go earlier in time
            // (thus minimizing updates)
            for (i = 0; i < array.length; i++) this.cascadeChangesForTask(array[ i ]);
        }

        this.suspendAutoRecalculateParents--;
        this.suspendAutoCascade--;
    },


    removeTaskDependencies : function (task) {
        var dependencyStore     = this.dependencyStore,
            deps                = task.getAllDependencies(dependencyStore);
        if (deps.length) dependencyStore.remove(deps);
    },


    removeTaskAssignments : function (task) {
        var assignmentStore     = this.getAssignmentStore(),
            assignments         = task.getAssignments();
        if (assignments.length) assignmentStore.remove(assignments);
    },


    onTaskDeleted : function (node, removedNode, isMove) {
        var dependencyStore     = this.dependencyStore;
        // remove dependencies associated with the task
        if (dependencyStore && !removedNode.isReplace && !isMove) {
            removedNode.cascadeBy(this.removeTaskDependencies, this);
        }


        // remove task assignments
        var assignmentStore     = this.getAssignmentStore();
        if (assignmentStore && !removedNode.isReplace && !isMove) {
            // Fire this event so UI can ignore the datachanged events possibly fired below
            assignmentStore.fireEvent('beforetaskassignmentschange', assignmentStore, removedNode.getInternalId(), []);

            removedNode.cascadeBy(this.removeTaskAssignments, this);

            // Fire this event so UI can just react and update the row for the task
            assignmentStore.fireEvent('taskassignmentschanged', assignmentStore, removedNode.getInternalId(), []);
        }

        var span        = this.getTotalTimeSpan();
        var startDate   = removedNode.getStartDate();
        var endDate     = removedNode.getEndDate();

        // if removed task dates were equal to total range then removing can affect total time span
        // so let's reset getTotalTimeSpan() cache
        if (endDate - span.end === 0 || startDate - span.start === 0) {
            this.lastTotalTimeSpan = null;
        }

        //if early/late dates are supported
        this.resetEarlyDates();
        this.resetLateDates();
    },


    onAssignmentMutation : function (assignmentStore, assignments) {
        var me      = this;

        Ext.each(assignments, function (assignment) {
            // Taskstore could be filtered etc.
            var t = assignment.getTask(me);
            if (t) {
                t.onAssignmentMutation(assignment);
            }
        });
    },


    onAssignmentStructureMutation : function (assignmentStore, assignments) {
        var me      = this;

        Ext.each(assignments, function (assignment) {
            var task  = assignment.getTask(me);

            if (task) {
                task.onAssignmentStructureMutation(assignment);
            }
        });
    },


    onDependencyAddOrUpdate: function (store, dependencies) {
        // reset early late dates cache
        this.resetEarlyDates();
        this.resetLateDates();

        // If cascade changes is activated, adjust the connected task start/end date
        if (this.cascadeChanges) {
            var me      = this,
                task;

            Ext.each(dependencies, function (dependency) {
                task = dependency.getTargetTask();
                if (task) {
                    task.constrain(me);
                }
            });
        }
    },

    onDependencyDelete: function (store, dependencies) {
        // reset early late dates cache
        this.resetEarlyDates();
        this.resetLateDates();
    },

    // pass "this" to filter function
    getNewRecords: function() {
        return Ext.Array.filter(this.tree.flatten(), this.filterNew, this);
    },

    // pass "this" to filter function
    getUpdatedRecords: function() {
        return Ext.Array.filter(this.tree.flatten(), this.filterUpdated, this);
    },


    // ignore root
    // @OVERRIDE
    filterNew: function(item) {
        // only want phantom records that are valid
        return item.phantom && item.isValid() && item != this.tree.root;
    },


    // ignore root
    // @OVERRIDE
    filterUpdated: function(item) {
        // only want dirty records, not phantoms that are valid
        return item.dirty && !item.phantom && item.isValid() && item != this.tree.root;
    },


    // Only used when not batching writes to the server. If batching is used, the server will always
    // see the full picture and can resolve parent->child relationships based on the PhantomParentId and PhantomId field values
    onTaskStoreBeforeSync: function (records, options) {
        var recordsToCreate     = records.create;

        if (recordsToCreate) {
            for (var r, i = recordsToCreate.length - 1; i >= 0; i--) {
                r = recordsToCreate[i];

                if (!r.isPersistable()) {
                    // Remove records that cannot yet be persisted (if parent is a phantom)
                    Ext.Array.remove(recordsToCreate, r);
                }
            }

            // Prevent empty create request
            if (recordsToCreate.length === 0) {
                delete records.create;
            }
        }

        return Boolean((records.create  && records.create.length  > 0) ||
                       (records.update  && records.update.length  > 0) ||
                       (records.destroy && records.destroy.length > 0));
    },

    onTaskStoreWrite : function(store, operation) {
        var dependencyStore = this.dependencyStore;

        if (!dependencyStore || operation.action !== 'create') {
            return;
        }

        var records = operation.getRecords(),
            newDependencies = dependencyStore.getNewRecords(),
            taskId;

        Ext.each(records, function(task) {
            taskId = task.getId();

            if (!task.phantom && taskId !== task._phantomId) {
                Ext.each(newDependencies, function (dep) {
                    var from = dep.getSourceId();
                    var to = dep.getTargetId();

                    // If dependency store is configured with autoSync, the 'set' operations below will trigger a Create action
                    // to setup the new "proper" dependencies
                    if (from === task._phantomId) {
                        dep.setSourceId(taskId);
                    } else if (to === task._phantomId) {
                        dep.setTargetId(taskId);
                    }
                });

                Ext.each(task.childNodes, function(child) {
                    if (child.phantom) {
                        child.set('parentId', taskId);
                    }
                });

                delete task._phantomId;
            }
        });
    },

    forEachTaskUnOrdered: function (fn, scope) {
        var hash    = this.tree.nodeHash;
        var root    = this.getRootNode();

        for (var property in hash) {
            if (hash[property] !== root)
                if (fn.call(scope || this, hash[property]) === false) return false;
        }
    },

    getTasksTimeSpan : function(tasks) {
        var earliest = new Date(9999,0,1), latest = new Date(0);

        var compareFn = function(r) {
            var startDate = r.getStartDate();
            var endDate = r.getEndDate();

            if (startDate && startDate < earliest) {
                earliest = startDate;
            }

            // Ignore tasks without start date as they aren't rendered anyway
            if (startDate && endDate && endDate > latest) {
                latest = endDate;
            }
        };

        if (tasks) {
            if (!Ext.isArray(tasks)) tasks = [tasks];

            Ext.Array.each(tasks, compareFn);
        } else {
            this.forEachTaskUnOrdered(compareFn);
        }

        earliest    = earliest < new Date(9999,0,1) ? earliest : null;
        latest      = latest > new Date(0) ? latest : null;

        return {
            start   : earliest,
            end     : latest || (earliest && Ext.Date.add(earliest, Ext.Date.DAY, 1)) || null
        };
    },

    /**
     * Returns an object defining the earliest start date and the latest end date of all the tasks in the store.
     * Tasks without start date are ignored, tasks without end date use their start date (if any) + 1 day
     * @return {Object} An object with 'start' and 'end' Date properties.
     */
    getTotalTimeSpan : function() {
        if (this.lastTotalTimeSpan) return this.lastTotalTimeSpan;

        this.lastTotalTimeSpan = this.getTasksTimeSpan();

        return this.lastTotalTimeSpan;
    },

    /**
     * Returns the project start date. This value is calculated (using {@link #getTotalTimeSpan} method) as an earliest start of all the tasks in the store.
     * **Note:** You can override this method to make alternative way of project start date calculation
     * (or for example to make this value configurable to store it in a database).
     * @return {Date} The project start date.
     */
    getProjectStartDate : function () {
        return this.getTotalTimeSpan().start;
    },

    /**
     * Returns the project end date. This value is calculated (using {@link #getTotalTimeSpan} method) as a latest end of all the tasks in the store.
     * @return {Date} The project end date.
     */
    getProjectEndDate : function () {
        return this.getTotalTimeSpan().end;
    },

    /**
     * Cascades the tree and counts all nodes.  Please note, this method will not count nodes that are supposed to be loaded lazily - it will only count nodes "physically" present in the store.
     *
     * @return {Boolean} (optional) ignoreRoot true to ignore counting the root node of the tree (defaults to true)
     * @return {Number} The number of tasks currently loaded in the store
     */
    getCount : function(ignoreRoot) {
        var count = ignoreRoot === false ? 0 : -1;
        this.getRootNode().cascadeBy(function() { count++; });
        return count;
    },

    /**
     * Returns an array of all the tasks in this store.
     *
     * @return {Gnt.model.Task[]} The tasks currently loaded in the store
     */
    toArray : function() {
        var tasks = [];

        this.getRootNode().cascadeBy(function(t) {
            tasks.push(t);
        });

        return tasks;
    },

    /**
     * Removes one or more tasks from the store
     *
     * @param {Gnt.model.Task/Gnt.model.Task[]} tasks The task(s) to remove
     */
    remove : function(records) {
        Ext.each(records, function(t) {
            t.remove();
        });
    },

    /**
    * Increase the indendation level of one or more tasks in the tree
    * @param {Gnt.model.Task/Gnt.model.Task[]} tasks The task(s) to indent
    */
    indent: function (nodes) {

        this.fireEvent('beforeindentationchange', this, nodes);

        // TODO method should fail (and return false?) if passed nodes are from different parent nodes
        nodes       = Ext.isArray(nodes) ? nodes.slice() : [ nodes ];

        nodes.sort(function(a, b) { return a.data.index - b.data.index; });

        this.suspendEvents(true);

        Ext.each(nodes, function(node) { node.indent(); });

        this.resumeEvents();

        this.fireEvent('indentationchange', this, nodes);
    },


    /**
    * Decrease the indendation level of one or more tasks in the tree
    * @param {Gnt.model.Task/Gnt.model.Task[]} tasks The task(s) to outdent
    */
    outdent: function (nodes) {
        this.fireEvent('beforeindentationchange', this, nodes);

        // TODO method should fail (and return false?) if passed nodes are from different parent nodes
        nodes       = Ext.isArray(nodes) ? nodes.slice() : [ nodes ];

        nodes.sort(function(a, b) { return b.data.index - a.data.index; });
        this.suspendEvents(true);

        Ext.each(nodes, function(node) { node.outdent(); });

        this.resumeEvents();

        this.fireEvent('indentationchange', this, nodes);
    },

    /**
    * Returns the tasks associated with a resource
    * @param {Gnt.model.Resource} resource
    * @return {Gnt.model.Task[]} the tasks assigned to this resource
    */
    getTasksForResource: function (resource) {
        return resource.getTasks();
    },

    getEventsForResource: function (resource) {
        return this.getTasksForResource(resource);
    },

    // Event store adaptions (flat store vs tree store)

    indexOf : function(rec) {
        // since indexOf is irrelevant for the event store in Scheduler, we only return 0 or -1
        // this is called by event selection model (by its superclass)
        return rec && this.tree.getNodeById(rec.internalId) ? 0 : -1;
    },

    getByInternalId : function(id) {
        return this.tree.getNodeById(id);
    },

    queryBy : function(fn, scope) {
        var retVal = [];
        var me = this;

        this.getRootNode().cascadeBy(function(task) {
            if (fn.call(scope || me, task)) {
                retVal.push(task);
            }
        });

        return retVal;
    },

    onSorted : function() {
        // After sorting we need to reapply filters if store was previously filtered
        if (this.lastTreeFilter) {
            this.filterTreeBy(this.lastTreeFilter);
        }
    },

    /**
     * Appends a new task to the store
     * @param {Gnt.model.Task} record The record to append the store
     */
    append : function(record) {
        this.getRootNode().appendChild(record);
    },

    resetEarlyDates : function () {
        this.earlyStartDates = {};
        this.earlyEndDates = {};
        this.fireEvent('resetearlydates');
    },

    resetLateDates : function () {
        this.lateStartDates = {};
        this.lateEndDates = {};
        this.fireEvent('resetlatedates');
    },

    /**
     * Returns Task by sequential number. See {@link Gnt.model.Task#getSequenceNumber} for details.
     *
     * @param {Number} number
     *
     * @return {Gnt.model.Task}
     */
    getBySequenceNumber : function(number) {
        return this.getRootNode().getBySequenceNumber(number);
    },

    destroy : function() {
        this.setCalendar(null);
        this.setAssignmentStore(null);
        this.setDependencyStore(null);
        this.setResourceStore(null);

        this.callParent(arguments);
    }
}, function() {
    this.override(Sch.data.mixin.FilterableTreeStore.prototype.inheritables() || {});
});
