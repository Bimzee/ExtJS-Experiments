/*

Ext Scheduler 2.5.2
Copyright(c) 2009-2014 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
 * @class Sch.tooltip.ClockTemplate
 * @extends Ext.XTemplate
 * @private
 * A template showing a clock. It accepts an object containing a 'date' and a 'text' property to its apply method.
 * @constructor
 * @param {Object} config The object containing the configuration of this model.
 **/
Ext.define("Sch.tooltip.ClockTemplate", {
    extend : 'Ext.XTemplate',

    constructor : function() {
        var toRad = Math.PI / 180,
            cos = Math.cos,
            sin = Math.sin,
            minuteHeight = 7,
            minuteTop = 2,
            minuteLeft = 10,
            hourHeight = 6,
            hourTop = 3,
            hourLeft = 10,
            isLegacyIE = Ext.isIE && (Ext.isIE8m || Ext.isIEQuirks);

        function getHourStyleIE(degrees) {
            var rad = degrees * toRad,
                cosV = cos(rad),
                sinV = sin(rad),
                y = hourHeight * sin((90-degrees)*toRad),
                x =hourHeight * cos((90-degrees)*toRad),
                topAdjust = Math.min(hourHeight, hourHeight - y),
                leftAdjust = degrees > 180 ? x : 0,
                matrixString = "progid:DXImageTransform.Microsoft.Matrix(sizingMethod='auto expand', M11 = " + cosV + ", M12 = " + (-sinV) + ", M21 = " + sinV + ", M22 = " + cosV + ")";
        
            return Ext.String.format("filter:{0};-ms-filter:{0};top:{1}px;left:{2}px;", matrixString, topAdjust+hourTop, leftAdjust+hourLeft);
        }

        function getMinuteStyleIE(degrees) {
            var rad = degrees * toRad,
                cosV = cos(rad),
                sinV = sin(rad),
                y = minuteHeight * sin((90-degrees)*toRad),
                x = minuteHeight * cos((90-degrees)*toRad),
                topAdjust = Math.min(minuteHeight, minuteHeight - y),
                leftAdjust = degrees > 180 ? x : 0,
                matrixString = "progid:DXImageTransform.Microsoft.Matrix(sizingMethod='auto expand', M11 = " + cosV + ", M12 = " + (-sinV) + ", M21 = " + sinV + ", M22 = " + cosV + ")";
        
            return Ext.String.format("filter:{0};-ms-filter:{0};top:{1}px;left:{2}px;", matrixString, topAdjust+minuteTop, leftAdjust+minuteLeft);
        }

        function getStyle(degrees) {
            return Ext.String.format("transform:rotate({0}deg);-ms-transform:rotate({0}deg);-moz-transform: rotate({0}deg);-webkit-transform: rotate({0}deg);-o-transform:rotate({0}deg);", degrees);
        }

        this.callParent([
            '<div class="sch-clockwrap {cls}">' +
                '<div class="sch-clock">' +
                    '<div class="sch-hourIndicator" style="{[this.getHourStyle((values.date.getHours()%12) * 30)]}">{[Ext.Date.monthNames[values.date.getMonth()].substr(0,3)]}</div>' +
                    '<div class="sch-minuteIndicator" style="{[this.getMinuteStyle(values.date.getMinutes() * 6)]}">{[values.date.getDate()]}</div>' +
                '</div>' +
                '<span class="sch-clock-text">{text}</span>' +
            '</div>',
            {
                compiled : true,
                disableFormats : true,

                getMinuteStyle : isLegacyIE ? getMinuteStyleIE : getStyle,
                getHourStyle : isLegacyIE ? getHourStyleIE : getStyle
            }
        ]);
    } 
});
