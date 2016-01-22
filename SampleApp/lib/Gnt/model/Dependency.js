/*

Ext Gantt 2.2.23
Copyright(c) 2009-2014 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**

@class Gnt.model.Dependency
@extends Sch.model.Customizable

This class represents a single Dependency in your gantt chart. It is a subclass of the {@link Sch.model.Customizable} class, which in its turn subclasses {@link Ext.data.Model}.
Please refer to documentation of those classes to become familar with the base interface of this class.

A Dependency has the following fields:

- `Id` - The id of the dependency itself
- `From` - The id of the task at which the dependency starts
- `To` - The id of the task at which the dependency ends
- `Lag` - A numeric part of the lag value between the tasks. Negative values are supported. Please note, that any lag-related calculations will be performed
  using project calendar. Also only working time is counted as "lag" time.
- `LagUnit` - A duration unit part of the lag value between the tasks. Default value is "d" (days). Valid values are:
    - "ms" (milliseconds)
    - "s" (seconds)
    - "mi" (minutes)
    - "h" (hours)
    - "d" (days)
    - "w" (weeks)
    - "mo" (months)
    - "q" (quarters)
    - "y" (years)

- `Cls` - A CSS class that will be applied to each rendered dependency DOM element
- `Type` - An integer constant representing the type of the dependency:
    - 0 - start-to-start dependency
    - 1 - start-to-end dependency
    - 2 - end-to-start dependency
    - 3 - end-to-end dependency

Subclassing the Dependency class
--------------------

The name of any field can be customized in the subclass, see the example below. Please also refer to {@link Sch.model.Customizable} for details.

    Ext.define('MyProject.model.Dependency', {
        extend      : 'Gnt.model.Dependency',

        toField     : 'targetId',
        fromField   : 'sourceId',

        ...
    })

*/

Ext.define('Gnt.model.Dependency', {
    extend              : 'Sch.model.Customizable',

    inheritableStatics  : {
        /**
         * @static
         * @property {Object} Type The enumerable object, containing names for the dependency types integer constants. 
         */
        Type    : {
            StartToStart    : 0,
            StartToEnd      : 1,
            EndToStart      : 2,
            EndToEnd        : 3
        }
    },

    idProperty          : 'Id',

    customizableFields     : [
        { name : 'Id' },

        // 3 mandatory fields
        { name: 'From' },
        { name: 'To' },
        { name: 'Type', type : 'int', defaultValue : 2},

        { name: 'Lag', type : 'number', defaultValue : 0},
        {
            name            : 'LagUnit',
            type            : 'string',
            defaultValue    : "d",
            // make sure the default value is applied when user provides empty value for the field, like "" or null
            convert         : function (value) {
                return value || "d";
            }
        },
        { name: 'Cls'}
    ],

    /**
    * @cfg {String} fromField The name of the field that contains the id of the source task.
    */
    fromField       : 'From',

    /**
    * @cfg {String} toField The name of the field that contains the id of the target task.
    */
    toField         : 'To',

    /**
    * @cfg {String} typeField The name of the field that contains the dependency type.
    */
    typeField       : 'Type',

    /**
    * @cfg {String} lagField The name of the field that contains the lag amount.
    */
    lagField        : 'Lag',

    /**
    * @cfg {String} lagUnitField The name of the field that contains the lag unit duration.
    */
    lagUnitField    : 'LagUnit',

    /**
    * @cfg {String} clsField The name of the field that contains a CSS class that will be added to the rendered dependency elements.
    */
    clsField        : 'Cls',

    isHighlighted   : false,

    constructor     : function(config) {
        this.callParent(arguments);

        if (config) {
            // Allow passing in task instances too
            if (config[this.fromField] && config[this.fromField] instanceof Gnt.model.Task) {
                this.setSourceTask(config[this.fromField]);

                delete config.fromField;
            }

            if (config[this.toField] && config[this.toField] instanceof Gnt.model.Task) {
                this.setTargetTask(config[this.toField]);

                delete config.toField;
            }
        }
    },


    getTaskStore : function() {
        return this.stores[0].taskStore;
    },

    /**
    * Returns the source task of the dependency
    * @return {Gnt.model.Task} The source task of this dependency
    */
    getSourceTask : function(taskStore) {
        return (taskStore || this.getTaskStore()).getById(this.getSourceId());
    },

    /**
    * Sets the source task of the dependency
    * @param {Gnt.model.Task} task The new source task of this dependency
    */
    setSourceTask : function(task) {
        this.setSourceId(task.getId() || task.internalId);
    },

    /**
    * Returns the target task of the dependency
    * @return {Gnt.model.Task} The target task of this dependency
    */
    getTargetTask : function(taskStore) {
        return (taskStore || this.getTaskStore()).getById(this.getTargetId());
    },

    /**
    * Sets the target task of the dependency
    * @param {Gnt.model.Task} task The new target task of this dependency
    */
    setTargetTask : function(task) {
        this.setTargetId(task.getId() || task.internalId);
    },

    /**
    * Returns the source task id of the dependency
    * @return {Mixed} The id of the source task for the dependency
    */
    getSourceId : function() {
        return this.get(this.fromField);
    },

    /**
    * Sets the source task id of the dependency
    * @param {Mixed} id The id of the source task for the dependency
    */
    setSourceId : function(id) {
        this.set(this.fromField, id);
    },

    /**
    * Returns the target task id of the dependency
    * @return {Mixed} The id of the target task for the dependency
    */
    getTargetId : function() {
        return this.get(this.toField);
    },

    /**
    * Sets the target task id of the dependency
    * @param {Mixed} id The id of the target task for the dependency
    */
    setTargetId : function(id) {
        this.set(this.toField, id);
    },

    /**
    * @method getType
    *
    * Returns the dependency type
    * @return {Mixed} The type of the dependency
    */

    /**
    * @method setType
    *
    * Sets the dependency type
    * @param {Mixed} id The type of the dependency
    */

    /**
    * @method getLag
    *
    * Returns the amount of lag for the dependency
    * @return {Number} id The amount of lag for the dependency
    */

    /**
    * @method setLag
    *
    * Sets the amount of lag for the dependency
    * @param {Number} id The amount of lag for the dependency
    */

    /**
    * Returns the duration unit of the lag.
    * @return {String} the duration unit
    */
    getLagUnit: function () {
        return this.get(this.lagUnitField) || 'd';
    },

    /**
    * @method setLagUnit
    *
    * Updates the lag unit of the dependency.
    *
    * @param {String} unit Lag duration unit
    */

    /**
     * @method getCls
     *
     * Returns the name of field holding the CSS class for each rendered dependency element
     *
     * @return {String} The cls field
     */

    /**
     * Returns true if the linked tasks have been persisted (e.g. neither of them are 'phantoms')
     *
     * @return {Boolean} true if this model can be persisted to server.
     */
    isPersistable : function() {
        var source = this.getSourceTask(),
            target = this.getTargetTask();

        return source && !source.phantom && target && !target.phantom;
    },


    /**
     * Returns `true` if the dependency is valid. Note, this method assumes that the model is part of a {@link Gnt.data.DependencyStore}.
     * Invalid dependencies are:
     * - a task linking to itself
     * - a dependency between a child and one of its parent
     * - transitive dependencies, e.g. if A -> B, B -> C, then A -> C is not valid
     *
     * @return {Boolean}
     */
    isValid : function (askStore) {
        var valid       = this.callParent(arguments),
            sourceId    = this.getSourceId(),
            targetId    = this.getTargetId(),
            type        = this.getType();

        if (valid) {
            valid       = Ext.isNumber(type) && !Ext.isEmpty(sourceId) && !Ext.isEmpty(targetId) && sourceId != targetId;
        }

        if (valid && askStore !== false && this.stores[ 0 ]) {
            valid       = this.stores[ 0 ].isValidDependency(sourceId, targetId, type, null, null, this);
        }

        return valid;
    },


    // We'll be using `internalId` for Id substitution when dealing with phantom records
    getInternalId : function(){
        return this.getId() || this.internalId;
    }
});
