/*
 
 Ext Scheduler 2.5.2
 Copyright(c) 2009-2014 Bryntum AB
 http://bryntum.com/contact
 http://bryntum.com/license
 
 */
/**
 @class Sch.widget.ExportDialogForm
 @private
 @extends Ext.form.Panel
 
 Form for {@link Sch.widget.ExportDialog}. This is a private class and can be overriden by providing `formPanel` option to
 {@link Sch.plugin.Export#cfg-exportDialogConfig exportDialogConfig}.
 */
Ext.define('Sch.widget.ExportDialogForm', {
    extend: 'Ext.form.Panel',
    requires: [
        'Ext.data.Store',
        'Ext.ProgressBar',
        'Ext.form.field.ComboBox',
        'Ext.form.field.Date',
        'Ext.form.FieldContainer',
        'Ext.form.field.Checkbox',
        'Sch.widget.ResizePicker'
    ],
    border: false,
    bodyPadding: '10 10 0 10',
    autoHeight: true,
    bodyBorder: false,
    initComponent: function() {
        var me = this;

        // HACK
        // fix for tooltip width
        // http://www.sencha.com/forum/showthread.php?260106-Tooltips-on-forms-and-grid-are-not-resizing-to-the-size-of-the-text
        if (Ext.getVersion('extjs').isLessThan('4.2.1')) {
            if (typeof Ext.tip !== 'undefined' && Ext.tip.Tip && Ext.tip.Tip.prototype.minWidth != 'auto') {
                Ext.tip.Tip.prototype.minWidth = 'auto';
            }
        }

        me.createFields();

        Ext.apply(this, {
            fieldDefaults: {
                labelAlign: 'left',
                labelWidth: 120,
                anchor: '99%'
            },
            items: [
                me.rangeField,
                me.resizerHolder,
                me.datesHolder,
                me.exportersField,
                me.formatField,
                me.orientationField,
                me.showHeaderField,
                me.progressBar || me.createProgressBar()
            ]
        });

        me.callParent(arguments);

        // trigger fields `change` listeners to enable/disable related fields
        me.onRangeChange(null, me.dialogConfig.defaultConfig.range);
        me.onExporterChange(me.exportersField, me.exportersField.getValue());

        me.on({
            hideprogressbar: me.hideProgressBar,
            showprogressbar: me.showProgressBar,
            updateprogressbar: me.updateProgressBar,
            scope: me
        });
    },
    isValid: function() {
        var me = this;
        if (me.rangeField.getValue() === 'date')
            return me.dateFromField.isValid() && me.dateToField.isValid();

        return true;
    },
    getValues: function(asString, dirtyOnly, includeEmptyText, useDataValues) {
        var result = this.callParent(arguments);

        var cellSize = this.resizePicker.getValues();
        if (!asString) {
            result.cellSize = cellSize;
        } else {
            result += '&cellSize[0]=' + cellSize[0] + '&cellSize[1]=' + cellSize[1];
        }

        return result;
    },
    createFields: function() {

        var me = this,
                cfg = me.dialogConfig,
                beforeLabelTextTpl = '<table class="sch-fieldcontainer-label-wrap"><td width="1" class="sch-fieldcontainer-label">',
                afterLabelTextTpl = '<td><div class="sch-fieldcontainer-separator"></div></table>';

        me.rangeField = new Ext.form.field.ComboBox({
            value: cfg.defaultConfig.range, //cfg.dateRangeText, //cfg.defaultConfig.range,
            triggerAction: 'all',
//            cls: 'sch-export-dialog-range',
            ui: cfg.defaultConfig.comboUi,
            forceSelection: true,
            editable: false,
            fieldLabel: cfg.rangeFieldLabel,
            name: 'range',
            queryMode: 'local',
            displayField: 'name',
            valueField: 'value',
            height: cfg.defaultConfig.comboHeight,
            store: new Ext.data.Store({
                fields: ['name', 'value'],
                data: [
//                    { name : cfg.completeViewText,  value : 'complete' },
                    {name: cfg.dateRangeText, value: 'date'},
                    {name: cfg.currentViewText, value: 'current'}
                ]
            }),
            listeners: {
                change: me.onRangeChange,
                scope: me
            }
        });


        // col/row resizer
        me.resizePicker = new Sch.widget.ResizePicker({
            dialogConfig: cfg,
            margin: '10 20'
        });

        me.resizerHolder = new Ext.form.FieldContainer({
            fieldLabel: cfg.scrollerDisabled ? cfg.adjustCols : cfg.adjustColsAndRows,
            labelAlign: 'top',
            hidden: true,
            labelSeparator: '',
            beforeLabelTextTpl: beforeLabelTextTpl,
            afterLabelTextTpl: afterLabelTextTpl,
            layout: 'vbox',
            defaults: {
                flex: 1,
                allowBlank: false
            },
            items: [me.resizePicker]
        });

        // from date
        me.dateFromField = new Ext.form.field.Date({
            fieldLabel: cfg.dateRangeFromText,
            baseBodyCls: 'dateWithBorderUI', //'sch-exportdialogform-date',
            name: 'dateFrom',
            format: cfg.dateRangeFormat || Ext.Date.defaultFormat,
            allowBlank: false,
//            maxValue: cfg.endDate,
//            minValue: cfg.startDate,
            value: cfg.startDate,
            triggerCls: 'customDateTrigger',
            ui: 'dateWithBorderUI',
            height: cfg.defaultConfig.comboHeight,
            margin: '5 5 5 0'
        });

        // till date
        me.dateToField = new Ext.form.field.Date({
            fieldLabel: cfg.dateRangeToText,
            name: 'dateTo',
            format: cfg.dateRangeFormat || Ext.Date.defaultFormat,
            baseBodyCls: 'dateWithBorderUI', //'sch-exportdialogform-date',
            allowBlank: false,
//            maxValue: cfg.endDate,
//            minValue: cfg.startDate,
            value: cfg.endDate,
            triggerCls: 'customDateTrigger',
            ui: 'dateWithBorderUI',
            height: cfg.defaultConfig.comboHeight,
            margin: '5 5 5 0'
        });

        // date fields holder
        me.datesHolder = new Ext.form.FieldContainer({
            fieldLabel: cfg.specifyDateRange,
            labelAlign: 'top',
//            hidden: true,
            labelSeparator: '',
            beforeLabelTextTpl: beforeLabelTextTpl,
            afterLabelTextTpl: afterLabelTextTpl,
            layout: {
                type: 'vbox',
                align: 'stretch'
            },
            defaults: {
                flex: 1,
                allowBlank: false
            },
            items: [me.dateFromField, me.dateToField],
//            ui: 'customTextFieldUI',
          
            margin: '5 0 5 0'

        });

        me.showHeaderField = new Ext.form.field.Checkbox({
            xtype: 'checkboxfield',
            fieldLabel: me.dialogConfig.showHeaderLabel,
            name: 'showHeader',
            checked: !!cfg.defaultConfig.showHeader,
            checkedValue: true,
            uncheckedValue: false,
            ui: 'legendCheckBox',
            checkedCls: 'legendCheckBox-checked',
            boxLabelCls: 'legendLabelCls',
            margin: '5 0 5 0'
        });

        me.exportersField = new Ext.form.field.ComboBox({
            value: cfg.defaultExporter,
            triggerAction: 'all',
//            cls: 'sch-export-dialog-exporter',
            ui: cfg.defaultConfig.comboUi,
            height: cfg.defaultConfig.comboHeight,
            forceSelection: true,
            editable: false,
            fieldLabel: cfg.exportersFieldLabel,
            name: 'exporterId',
            queryMode: 'local',
            displayField: 'name',
            valueField: 'value',
            store: me.buildExporterStore(cfg.exporters),
            listeners: {
                change: me.onExporterChange,
                scope: me
            },
            margin: '5 0 5 0'
        });

        me.formatField = new Ext.form.field.ComboBox({
            value: cfg.defaultConfig.format,
            triggerAction: 'all',
            forceSelection: true,
            editable: false,
            fieldLabel: cfg.formatFieldLabel,
            ui: cfg.defaultConfig.comboUi,
            height: cfg.defaultConfig.comboHeight,
            name: 'format',
            queryMode: 'local',
            store: ["A5", "A4", "A3", "Letter", "Legal"],
            margin: '10 0 5 0'
        });

        var orientationLandscapeCls = cfg.defaultConfig.orientation === "portrait" ? 'class="sch-none"' : '',
                orientationPortraitCls = cfg.defaultConfig.orientation === "landscape" ? 'class="sch-none"' : '';

        me.orientationField = new Ext.form.field.ComboBox({
            value: cfg.defaultConfig.orientation,
            matchFieldWidth: true,
            ui: cfg.defaultConfig.comboUi,
            margin: '10 0 5 0',
            height: cfg.defaultConfig.comboHeight,
            triggerAction: 'all',
            componentCls: 'sch-exportdialogform-orientation',
            forceSelection: true,
            editable: false,
            fieldLabel: me.dialogConfig.orientationFieldLabel,
            afterSubTpl: new Ext.XTemplate('<span id="sch-exportdialog-imagePortrait" ' + orientationPortraitCls +
                    '></span><span id="sch-exportdialog-imageLandscape" ' + orientationLandscapeCls + '></span>'),
            name: 'orientation',
            displayField: 'name',
            valueField: 'value',
            queryMode: 'local',
            store: new Ext.data.Store({
                fields: ['name', 'value'],
                data: [
                    {name: cfg.orientationPortraitText, value: 'portrait'},
                    {name: cfg.orientationLandscapeText, value: 'landscape'}
                ]
            }),
            listeners: {
                change: function(field, newValue) {
                    switch (newValue) {
                        case 'landscape':
                            Ext.fly('sch-exportdialog-imagePortrait').toggleCls('sch-none');
                            Ext.fly('sch-exportdialog-imageLandscape').toggleCls('sch-none');
                            break;
                        case 'portrait':
                            Ext.fly('sch-exportdialog-imagePortrait').toggleCls('sch-none');
                            Ext.fly('sch-exportdialog-imageLandscape').toggleCls('sch-none');
                            break;
                    }
                }
            }
        });
    },
    // Builds a store to be used for the `Export mode` combobox
    // @param {Object}
    // @return {Ext.data.Store}
    buildExporterStore: function(exporters) {

        var data = [];

        for (var i = 0, l = exporters.length; i < l; i++) {
            var exporter = exporters[i];

            data.push({
                name: exporter.getName(),
                value: exporter.getExporterId()
            });
        }

        return Ext.create('Ext.data.Store', {
            fields: ['name', 'value'],
            data: data
        });
    },
    createProgressBar: function() {
        return this.progressBar = new Ext.ProgressBar({
            text: this.config.progressBarText,
            animate: true,
            hidden: true,
            margin: '4px 0 10px 0'
        });
    },
    onRangeChange: function(field, newValue) {

        switch (newValue) {
            case 'complete':
                this.datesHolder.hide();
                this.resizerHolder.hide();
                break;
            case 'date':
                this.datesHolder.show();
                this.resizerHolder.hide();
                break;
            case 'current':
                this.datesHolder.hide();
                this.resizerHolder.show();
                this.resizePicker.expand(true);
                break;
        }
    },
    /**
     * @protected
     * This method is called after user selects an export mode in the corresponding field.
     * @param  {Ext.form.field.Field} field Reference to the form field
     * @param  {String} exporterId Selected exporter identifier
     */
    onExporterChange: function(field, exporterId) {

        switch (exporterId) {
            case  'singlepage':
                this.disableFields(true);
                break;
            default :
                this.disableFields(false);
        }

    },
    disableFields: function(value) {
        var me = this;

        me.showHeaderField.setDisabled(value);
        me.formatField.setDisabled(value);
        me.orientationField.setDisabled(value);
    },
    showProgressBar: function() {
        if (this.progressBar)
            this.progressBar.show();
    },
    hideProgressBar: function() {
        if (this.progressBar)
            this.progressBar.hide();
    },
    updateProgressBar: function(value, text) {

        if (this.progressBar) {

            this.progressBar.updateProgress(value);

            if (text) {
                this.progressBar.updateText(text);
            }

        }
    }
});
