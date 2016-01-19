var today = new Date();
Ext.Date.clearTime(today);

Ext.define("SampleApp.store.EventStore", {
    extend: 'Sch.data.EventStore',
    model: 'SampleApp.model.EventeModel',
    data : [
                { ResourceId  : 'r1',
                    Name      : 'Event-1',
                    StartDate : Sch.util.Date.add(today, Sch.util.Date.DAY, 2),
                    EndDate   : Sch.util.Date.add(today, Sch.util.Date.DAY, 6)
                },
                { ResourceId  : 'r2',
                    Name      : 'Event-2',
                    StartDate : Sch.util.Date.add(today, Sch.util.Date.DAY, 6),
                    EndDate   : Sch.util.Date.add(today, Sch.util.Date.DAY, 11)
                },
                { ResourceId  : 'r3',
                    Name      : 'Event-3',
                    StartDate : Sch.util.Date.add(today, Sch.util.Date.DAY, 8),
                    EndDate   : Sch.util.Date.add(today, Sch.util.Date.DAY, 12)
                },
                { ResourceId  : 'r12',
                    Name      : 'Event-4',
                    StartDate : Sch.util.Date.add(today, Sch.util.Date.DAY, 4),
                    EndDate   : Sch.util.Date.add(today, Sch.util.Date.DAY, 13)
                },
                { ResourceId  : 'r14',
                    Name      : 'Event-5',
                    StartDate : Sch.util.Date.add(today, Sch.util.Date.DAY, 9),
                    EndDate   : Sch.util.Date.add(today, Sch.util.Date.DAY, 12)
                },
                { ResourceId  : 'r15',
                    Name      : 'Event-6',
                    StartDate : Sch.util.Date.add(today, Sch.util.Date.DAY, 7),
                    EndDate   : Sch.util.Date.add(today, Sch.util.Date.DAY, 13)
                }
            ]
});