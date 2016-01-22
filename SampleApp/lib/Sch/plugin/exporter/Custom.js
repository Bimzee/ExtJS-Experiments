

Ext.define('Sch.plugin.exporter.Custom', {
    extend: 'Sch.plugin.exporter.MultiPageVertical',
    config: {
        exporterId: 'custom'
    },
    onRowsCollected: function(lockedRows, normalRows) {
        var me = this;

        me.iterateAsync(function(next, rowIndex) {

            if (rowIndex === lockedRows.length) {
                me.onPagesExtracted();
                return;
            }

            var index = rowIndex,
                    spaceLeft = me.printHeight,
                    lockeds = [],
                    normals = [],
                    normal,
                    newPage = false;

            me.startPage();

            var count = 0;
            while (count < 8 && index < lockedRows.length) {

                normal = normalRows[index];
                spaceLeft -= normal.height;

                lockeds.push(lockedRows[index]);
                normals.push(normal);
                index++;
                count++;
            }

            me.fillGrids(lockeds, normals);
            me.commitPage();

            next(index);

        }, me, 0);
    },
    //change this accordingly to your needs
    fitComponentIntoPage: function() {
        var me = this,
                component = me.getComponent(),
                normalGrid = component.normalGrid,
                lockedGrid = component.lockedGrid,
                totalWidth = me.getTotalWidth(),
                ticks = me.ticks,
                timeColumnWidth = me.timeColumnWidth || me.restoreSettings.columnWidth;

        var lockedWidth = Math.floor((me.visibleColumnsWidth / totalWidth) * me.paperWidth),
                normalWidth = Math.floor((ticks.length * timeColumnWidth / totalWidth) * me.paperWidth),
                tickWidth = Math.floor(normalWidth / ticks.length),
                tickWidth = tickWidth < 10 ? 10 : tickWidth,
                rowHeight = (tickWidth / timeColumnWidth) * me.getRowHeight();

//        me.view.setRowHeight(rowHeight < me.minRowHeight ? me.minRowHeight : rowHeight);
//
//        component.setWidth(me.paperWidth);
//        normalGrid.setWidth(normalWidth);
//        lockedGrid.setWidth(lockedWidth);
//
//        me.fitLockedColumnWidth(lockedWidth);

        me.view.setRowHeight(90);

        component.setWidth(me.paperWidth);
        normalGrid.setWidth(me.paperWidth - 175);
        lockedGrid.setWidth(175);

        me.fitLockedColumnWidth(175);

        component.setTimeColumnWidth(tickWidth);
    }

});


