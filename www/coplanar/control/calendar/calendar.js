steal('coplanar/control', 'can', 'jquery',
      'jquery-ui', 'fullcalendar',
function(Control, can, jQuery) {

    Control.Calendar = Control.extend({
        defaults: {
            model: null,
            eventsView: 'edit',
            calendarOptions: {},
            defaultCalendarView: 'month',
        },

        weekToDate: function(year, wn, dayNb){
            if (dayNb == null)
                dayNb = 0;
            var j10 = new Date( year,0,10,12,0,0);
            var j4 = new Date( year,0,4,12,0,0);
            var mon1 = j4.getTime() - j10.getDay() * 86400000;
            return new Date(mon1 + ((wn - 1)  * 7  + dayNb) * 86400000);
        },
    },{
        init: function () {
            this._super.apply(this, arguments);
            this.eventsFilter = {};
            var inited = false;
            if (this._calendar == null)
                this._calendar = this.element;
            this.fullCalendar(can.extend({
                viewDisplay: function(view) {
                    // We don't want to alter the initial view
                    if (inited === false) {
                        inited = true;
                        return;
                    }
                    if (can.route.attr('calendarView') === 'month') {
                        can.route.redirect({
                            year: jQuery.datepicker.formatDate('yy', view.start),
                            month: jQuery.datepicker.formatDate('mm', view.start),
                        }, true);
                    } else if (can.route.attr('calendarView') === 'week') {
                        var week = jQuery.fullCalendar.formatDate(view.start, 'W');
                        can.route.redirect({
                            // On week 1 we must use the end date for the year.
                            year: jQuery.datepicker.formatDate(
                                'yy', parseInt(week) > 1 ? view.start : view.end),
                            week: week,
                        }, true);
                    } else if (can.route.attr('calendarView') === 'day') {
                        can.route.redirect({
                            year: jQuery.datepicker.formatDate('yy', view.start),
                            month: jQuery.datepicker.formatDate('mm', view.start),
                            day: jQuery.datepicker.formatDate('dd', view.start),
                        }, true);
                    }
                },
                events: can.proxy(this.getEvents, this),
                eventDataTransform: can.proxy(this.makeCalendarEvent, this),
                eventClick: can.proxy(this.eventClick, this),
                dayClick: can.proxy(this.dayClick, this),
                eventAfterRender: can.proxy(this.eventAfterRender, this),
                dayRender: can.proxy(this.dayRender, this)
            }, this.options.calendarOptions));
            this.options.model.bind('updated', can.proxy(this.onModelUpdated, this));
            this.options.model.bind('created', can.proxy(this.onModelUpdated, this));
            this.options.model.bind('destroyed', can.proxy(this.onModelUpdated, this));
        },

        weekToDate: function(year, wn) {
            var firstDay = this.fullCalendar('option', 'firstDay');
            if (firstDay < 1)
                firstDay = 6;
            else
                firstDay -= 1;
            return this.constructor.weekToDate(year, wn, firstDay);
        },

        fullCalendar: function () {
            return this._calendar.fullCalendar.apply(this._calendar, arguments);
        },

        makeCalendarEvent: function(data) {
            return can.extend({}, data);
        },

        getEvents: function(start, end, callback) {
            return this.options.model.findAll(this.eventsFilter)
                .done(callback);
        },

        onModelUpdated: function (domEvent, obj) {
            // This only work while the calendar is visible :(
            // To over come this we force a rerender in the show method.
            console.log('onModelUpdated !!!');
            this.fullCalendar('refetchEvents');
        },

        eventClick: function(event, jsEvent, view) {
            can.route.redirect({ model: can.route.attr('model'),
                                 view: this.options.eventsView,
                                 id: event[this.options.model.id]});
        },

        dayClick: function(date, allDay, jsEvent, view) {
        },

        eventAfterRender: function(event, element, view) {
        },

        dayRender: function( date, cell ) {
        },

        show: function() {
            this._super();
            // Make sure the view is up to date with the data
            this.fullCalendar('rerenderEvents');
        },

        setRoute: function(route) {
            // Normalize the view name
            var calendarView = route.calendarView || this.options.defaultCalendarView;
            if (calendarView !== 'month' &&
                calendarView !== 'week' &&
                calendarView !== 'day')
                calendarView = 'month';

            // Map to fullcalendar names
            var fcView;
            if (calendarView === 'week')
                fcView = 'basicWeek';
            else if (calendarView === 'day')
                fcView = 'basicDay';
            else
                fcView = 'month';

            // Change the view if needed
            if (this.fullCalendar('getView').name !== fcView) {
                console.log('Change view');
                this.fullCalendar('changeView', fcView);
            }

            // Set the date
            var date, today = new Date();
            var year = route.year ? parseInt(route.year) : today.getFullYear();
            if (calendarView === 'week') {
                date = route.week ?
                    this.weekToDate(year, parseInt(route.week)) :
                    today;
            } else {
                var month = route.month ? parseInt(route.month)-1 : today.getMonth();
                var day = route.day ? parseInt(route.day) : today.getDate();
                date = new Date(year, month, day);
            }

            console.log('Goto date:', date);
            this.fullCalendar('gotoDate', date);
        }
    });

    return Control.Calendar;
});
