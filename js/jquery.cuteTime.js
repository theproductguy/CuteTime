/******************************************************************************************************

	jQuery.cuteTime

	Author Jeremy Horn
	Version 1.1.3
	Date: 4/6/2010

	Copyright (c) 2009 Jeremy Horn- jeremydhorn(at)gmail(dot)c0m | http://tpgblog.com
	Dual licensed under MIT and GPL.

	DESCRIPTION

		It's CuteTime!

		CuteTime is a customizable jQuery plugin that automatically converts timestamps	to 
		formats much cuter.  Also has the ability to dynamically re-update and/or 
		automatically update timestamps on a controlled interval.

		If used by Selector, replaces the text of the provided object with a cuteTime.
		If used as a function, returns a string containing a cuteTime version of the provided 
		timestamp.

		BY DEFAULT
		automatic updating is disabled and the following CuteTimes can be displayed...

				the future!
				just now
				a few seconds ago
				a minute ago
			x	minutes ago
				an hour ago
			x	hours ago
				yesterday
			x	days ago
				last month
			x	months ago
				last year
			x	years ago

	IMPLEMENTATION

		$('.timestamp').cuteTime();
		$('.timestamp').cuteTime({ / * OPTIONS * / });
		
		cutetime_object = $('.timestamp').cuteTime();
		cutetime_object.update_cuteness();

		$.cuteTime('2009/10/12 22:11:19');
		$.cuteTime({ / * OPTIONS * / }, '2009/10/12 22:11:19');

	COMPATIBILITY

		Tested in FF3.5, IE7
		With jQuery 1.3.2

	METHODS

		When initialized the cuteTime variable either updates or assigns the TS_ATTR
		attribute to the provided objects.  Method implementation supports chaining and 
		returns jQuery object.  

			e.g.
				<div class='timestamp' data-timestamp='2009 10 12 22:11:19'>2009 10 12 22:11:19</div>				
		
		If the cutetime attribute already exists within the provided object, then the
		text within the object is ignored in the cutification process.  If the cutetime attribute 
		does not exist or an invalid one is provided, then a valid cutetime attribute is assigned
		to the object.

		If the cutetime attribute is missing, then it is calculated from the text of the 
		provided object.
		
		If neither cutetime attibute nor valid object text exist then the timestamp is assumed 
		to by 'now'.

		stop_cuteness()
			stops all automatic updates of refresh enabled timestamps

		start_cuteness()
			starts the automatic updating of timestamps
			REMINDER: make sure refresh is set to > 0

		update_cuteness()
			updates timestamps of the provided objects

	FUNCTIONS

		cuteTime(<STRING>)

	CUSTOMIZATION

		cuteTime(OPTIONS)
		e.g. $('.ts2').cuteTime({ refresh: 60000 });
		
		refresh:		time in milliseconds before next refresh of page data; -1 == no refresh
		time_ranges:	array of bound_structures definining the cute descriptions associated with
						time ranges

		bound_structures consist of the following variables
			bound:		lower inclusive bound, or starting point, for using the 'cuteness' string 
						for describing the current timestamp

						the exclusive upper bound is defined by the next bound definition in the 
						time_ranges array

			cuteness:	string to use in place of the current timestamp
						
						the special keyword %CT% can be used within the cutetime string to 
						override the prepending of the calculated difference, when called for
						
							e.g. "it was %CT% hours ago"   
			
			unit_size:	the divisor to apply to the calculated time difference; if unit_size > 0
						then a number value is prepended to the cuteness string as calculated by
						time_difference / unit_size
							e.g. 4 hours ago
						
						if unit_size = 0, then no number is pre-pended to the cuteness string
							e.g. an hour ago

		EXAMPLE	OPTIONS = 
			{	refresh: -1,
				time_ranges: [
					{bound: NEG_INF,
							cuteness: 'the future!',		unit_size: 0},
					{bound: 0, 
							cuteness: 'just now',			unit_size: 0},
					{bound: 60 * 1000, 
							cuteness: 'a minute ago',		unit_size: 0},
					{bound: 60 * 1000 * 2, 
							cuteness: ' minutes ago',		unit_size: 60 * 1000},
					{bound: 60 * 1000 * 60, 
							cuteness: 'an hour ago',		unit_size: 0},
					{bound: 60 * 1000 * 60 * 2, 
							cuteness: ' hours ago',			unit_size: 60 * 1000 * 60},
					{bound: POS_INF, 
							cuteness: 'a blinkle ago',		unit_size: 0}
				]
			};


	VALID TIMESTAMP FORMAT EXAMPLES

		2009-10-15 14:06:23											*doesn't work in IE
		Thu Oct 15 2009 22:11:19 GMT-0400 (Eastern Daylight Time
		Oct 15 2009 22:11:19
		2009 10 12 22:11:19											* only works in FF
		10 15 2009 22:11:19											* only works in FF

		ALL ISO8601 Date/Time Formats Also Supported
		2009-11-24T19:20:30+01:00
		2009-11
		2009-11-24T13:15:30Z
		...etc...
		
		* if the TIMESTAMP can be recognized by the JavaScript Date() Object then it is VALID 
		  (i.e. if it can be parsed by Date.parse())
		** IE date parsing is VERY DIFFERENT (and more limiting) than FF :-(  [not cute!]

	MORE

		For more usage and examples, go to:
		http://tpgblog.com/cutetime/

******************************************************************************************************/

(function($) {
	// CONSTANTS
	var NEG_INF = Number.NEGATIVE_INFINITY;
	var POS_INF = Number.POSITIVE_INFINITY;
	var TS_ATTR	= 'data-timestamp';

	/**********************************************************************************

		FUNCTION
			cuteTime

		DESCRIPTION
			cuteTime method constructor
			
			allows for customization of refreh rate the time difference ranges and 
			cute descriptions
			
				e.g. $(something).cuteTime();

	**********************************************************************************/
	$.fn.cuteTime = function(options) {
		var right_now = new Date().getTime();
		var other_time;
		var curr_this;

		// check for new & valid options
		if ((typeof options == 'object') || (options == undefined)) {
			// then update the settings [destructive]
			$.fn.cuteTime.c_settings = $.extend({}, $.fn.cuteTime.settings, options);
			$.fn.cuteTime.the_selected = this;

			// process all provided objects
			this.each(function() {
				// element-specific code here
				curr_this = $(this);
				other_time = get_time_value(curr_this);
				curr_this.html(get_cuteness(right_now - other_time));
			});

			// check for and conditionally launch the automatic refreshing of timestamps
			$.fn.cuteTime.start_cuteness();
		}
		
		return this;
	};

	/**********************************************************************************

		FUNCTION
			cuteTime

		DESCRIPTION
			cuteTime function
			
			accepts a string representation of a timestamp as its parameter and 
			returns a string version of its equivalent cutetime
			
				e.g. $.cuteTime('2009 10 12 22:11:19');
				
				or
				
				e.g. $.cuteTime(SETTINGS, '2009 10 12 22:11:19');

			can be customized by directly accessing the settings:
				$.fn.cuteTime.settings = ...

	**********************************************************************************/
	$.cuteTime = function(options, val) {
		var right_now = new Date().getTime();
		var other_time;
		var curr_this;
		var ts_string = null;

		if (typeof options == 'object') {
			$.fn.cuteTime.c_settings = $.extend({}, $.fn.cuteTime.settings, options);
		} 

		if (typeof options == 'string') {
			ts_string = options;
		} else if (typeof val == 'string') {
			ts_string = val;	
		}
	
		if (ts_string != null) {
			// then we will be returning a cutetime string and doing nothing else
			other_time = date_value(ts_string);
			if (!isNaN(other_time)) {
				return get_cuteness(right_now - other_time);
			} else {
				// on failure return error message
				return 'INVALID_DATETIME_FORMAT';
			}
		}

		return this;
	};


	/**********************************************************************************

		FUNCTION
			cuteTime.settings

		DESCRIPTION
			data stucture containing the refresh rate and time range specifications
			for the cuteTimes
			
			can be directly accessed by	'$.fn.cuteTime.settings = ... ;'

	**********************************************************************************/
	$.fn.cuteTime.settings = {
		refresh: -1,					// time in milliseconds before next refresh of page data; -1 == no refresh
		time_ranges: [
			{bound: NEG_INF,			// IMPORANT: bounds MUST be in ascending order, from negative infinity to positive infinity
					cuteness: 'the future!',		unit_size: 0},
			{bound: 0, 
					cuteness: 'just now',			unit_size: 0},
			{bound: 20 * 1000, 
					cuteness: 'a few seconds ago',	unit_size: 0},
			{bound: 60 * 1000, 
					cuteness: 'a minute ago',		unit_size: 0},
			{bound: 60 * 1000 * 2, 
					cuteness: ' minutes ago',		unit_size: 60 * 1000},
			{bound: 60 * 1000 * 60, 
					cuteness: 'an hour ago',		unit_size: 0},
			{bound: 60 * 1000 * 60 * 2, 
					cuteness: ' hours ago',			unit_size: 60 * 1000 * 60},
			{bound: 60 * 1000 * 60 * 24, 
					cuteness: 'yesterday',			unit_size: 0},
			{bound: 60 * 1000 * 60 * 24 * 2, 
					cuteness: ' days ago',			unit_size: 60 * 1000 * 60 * 24},
			{bound: 60 * 1000 * 60 * 24 * 30,	
					cuteness: 'last month',			unit_size: 0},
			{bound: 60 * 1000 * 60 * 24 * 30 * 2, 
					cuteness: ' months ago',		unit_size: 60 * 1000 * 60 * 24 * 30},
			{bound: 60 * 1000 * 60 * 24 * 30 * 12, 
					cuteness: 'last year',			unit_size: 0},
			{bound: 60 * 1000 * 60 * 24 * 30 * 12 * 2, 
					cuteness: ' years ago',			unit_size: 60 * 1000 * 60 * 24 * 30 * 12},
			{bound: POS_INF, 
					cuteness: 'a blinkle ago',		unit_size: 0}
		]
	};


	/**********************************************************************************

		FUNCTION
			cuteTime.start_cuteness

		DESCRIPTION
			activates the recurring process to update the objects' timestamps

			IMPORTANT: make sure refresh has been set to > 0

		TODO
			allow for the specifying of a new refresh rate when this function is called

	**********************************************************************************/
	$.fn.cuteTime.start_cuteness = function() {
		var refresh_rate = $.fn.cuteTime.c_settings.refresh;

		if ($.fn.cuteTime.process_tracker == null) {
			if (refresh_rate > 0) {
				$.fn.cuteTime.process_tracker = setInterval( "$.fn.cuteTime.update_cuteness()", refresh_rate );
			}
		} else { 
			// ignore this call; auto-refresh is already running!!
		}
		return this;
	};


 	/**********************************************************************************

		FUNCTION
			cuteTime.update_cuteness

		DESCRIPTION
			updates the objects' timestamps

	**********************************************************************************/
	$.fn.cuteTime.update_cuteness = function() {
		var right_now = new Date().getTime();
		var curr_this;
		var other_time;

		$.fn.cuteTime.the_selected.each(function() {
			curr_this = $(this);
			other_time = get_time_value(curr_this);
			curr_this.html(get_cuteness(right_now - other_time));
		});
	}


	/**********************************************************************************

		FUNCTION
			cuteTime.stop_cuteness

		DESCRIPTION
			deactivates the recurring process that updates the objects' timestamps

	**********************************************************************************/
	$.fn.cuteTime.stop_cuteness = function() {
		if ($.fn.cuteTime.process_tracker != null) {
			clearInterval($.fn.cuteTime.process_tracker);
			$.fn.cuteTime.process_tracker = null;
		} else {
			// ignore this call; there is nothing to stop!!
		}
		
		return this;
	};


	//////////////////////////////////////////////////////////////////////////////////

	// private functions and settings

	/**********************************************************************************

		FUNCTION
			get_cuteness

		DESCRIPTION
			based on passed in time_difference (in milliseconds) returns a string
			of the associated cuteness
			
			if a number should be insterted into the string (unit_size not empty)
				THEN
					if %CT% exists within the cuteness STRING 
						THEN replace it with the calculated number
						ELSE prepend the calculated number to the front of the string
						     (mostly for backwards compatibility) 

			ON ERROR returns time in 'pookies'

	**********************************************************************************/
	function get_cuteness(time_difference) {
		var time_ranges = $.fn.cuteTime.c_settings.time_ranges;
		var pre_calculated_time, calculated_time;
		var cute_time = '';

		jQuery.each(time_ranges, function(i, timespan) {
			if (i < time_ranges.length-1) {
				if ((	time_difference		>=		timespan['bound']) &&
					(	time_difference		<		time_ranges[i+1]['bound'])) {
					if (timespan['unit_size'] > 0) {
						calculated_time = Math.floor(time_difference / timespan['unit_size']);
					} else {
						calculated_time = '';
					}

					// allow for inline replacement
					pre_calculated_time = timespan['cuteness'].replace(/%CT%/, calculated_time);
					
					if (pre_calculated_time == timespan['cuteness']) {
						// nothing was replaced
						// prepend the value
						cute_time = calculated_time + timespan['cuteness'];
						
					} else {
						// inline replacement occurred
						cute_time = pre_calculated_time;
					}

					return false;
				}
			} else {
				return false;
			}
		});

		// something is wrong with the time
		if (cute_time == '') {
			cute_time = '2 pookies ago'; // IMPORTANT: ALWAYS BE CUTE!!! 
		}

		return cute_time;
	}


	/**********************************************************************************

		FUNCTION
			date_value

		DESCRIPTION
			returns the date in time measured since 1970 (see definition of Date.valueOf)

			if not ISO 8601 date format compliant, performs minimal date correction 
			to expand the range of VALID date formats

	**********************************************************************************/
	function date_value(the_date) {
	
		var the_value;
	
		if ((new_date = toISO8601(the_date)) != null) {
			the_value = new_date.valueOf();
		} else {
		
			the_value = (new Date(the_date)).valueOf();
			
			if (isNaN(the_value)) {
				// then the date must be the alternate db styled format
				the_value = new Date(the_date.replace(/-/g, " "));
			}
		}
		return the_value;
	}


	/**********************************************************************************

		FUNCTION
			toISO8601

		DESCRIPTION
			converts an ISO8601 formatted timestamp to the JavaScript Date() Object
			if the provided string is not in ISO8601 format, then null is returned

			** Note to people who copy this function:  If you like it, if you use it,
			please provide credit to Jeremy Horn, The Product Guy @ http://tpgblog.com
			and the jQuery CuteTime Plugin @ http://tpgblog.com/cutetime;  Thanks. :-)

			ISO8601
			http://www.w3.org/TR/NOTE-datetime
			  
				Year:
				  YYYY (eg 1997)
				Year and month:
				  YYYY-MM (eg 1997-07)
				Complete date:
				  YYYY-MM-DD (eg 1997-07-16)
				Complete date plus hours and minutes:
				  YYYY-MM-DDThh:mmTZD (eg 1997-07-16T19:20+01:00)
				Complete date plus hours, minutes and seconds:
				  YYYY-MM-DDThh:mm:ssTZD (eg 1997-07-16T19:20:30+01:00)
				Complete date plus hours, minutes, seconds and a decimal fraction of a second
				  YYYY-MM-DDThh:mm:ss.sTZD (eg 1997-07-16T19:20:30.45+01:00)
			
			  	Formatted REGEXP used within...
			  	
					/^(\d{4})(
					    (-(\d{2})
					        (-(\d{2})
					            (T(\d{2}):(\d{2})
					                (:(\d{2})
					                    (.(\d+))?
					                )?
					                (Z|(
					                    ([+-])((\d{2}):(\d{2}))
					                ))
					            )?
					        )?
					    )?
					)$/
					
		NOTE
			String.match() returns:
				in FireFox, 			void(0) 
				in Internet Explorer, 	"" <-- empty string
			... for unmatched elements within the array
			
	**********************************************************************************/
	function toISO8601(the_date){
	
		var iso_date = the_date.match(/^(\d{4})((-(\d{2})(-(\d{2})(T(\d{2}):(\d{2})(:(\d{2})(.(\d+))?)?(Z|(([+-])((\d{2}):(\d{2})))))?)?)?)$/);
		
		if (iso_date != null) {
			var new_date = new Date();
			var TZ_hour_offset = 0;
			var TZ_minute_offset = 0;
			
			new_date.setUTCFullYear(iso_date[1]);
			if (!isEmpty(iso_date[4])) {
				new_date.setUTCMonth(iso_date[4] - 1);
				if (!isEmpty(iso_date[6])) {
					new_date.setUTCDate(iso_date[6]);
					
					// check TZ first
					if (!isEmpty(iso_date[16])) {
						TZ_hour_offset = iso_date[18];
						TZ_minute_offset = iso_date[19];
						
						if (iso_date[16] == '-') { // is the time offset negative ?
							TZ_hour_offset *= -1;
							TZ_minute_offset *= -1;
						} // otherwise: timeoffset is positive & do nothing
					}
					
					if (!isEmpty(iso_date[8])) {
						new_date.setUTCHours(iso_date[8] - TZ_hour_offset);
						new_date.setUTCMinutes(iso_date[9] - TZ_minute_offset)
						if (!isEmpty(iso_date[11])) {
							new_date.setUTCSeconds(iso_date[11]);
							if (!isEmpty(iso_date[13])) {
								new_date.setUTCMilliseconds(iso_date[13]*1000);
							}
						}
					}
					
				}
			}

			return new_date;
		} else {
			return null;
		}
	}


	/**********************************************************************************

		FUNCTION
			isEmpty

		DESCRIPTION
			determines whether or not the passed in string is EMPTY
			
			EMPTY = null OR "" {EMPTY STRING}

	**********************************************************************************/
	function isEmpty( inputStr ) { 
		if ( null == inputStr || "" == inputStr ) { 
			return true; 
		} 
		
		return false; 
	}

	/**********************************************************************************

		FUNCTION
			get_time_value

		DESCRIPTION
			get the time value specified either in the text or the cuteime attribute 
			of the object and update the cutetime attribute whether initially present
			or not

			If the cutetime attribute already exists within the provided object, 
				then the text within the object is ignored in the cutification 
				process.  If the cutetime attribute does not exist or an invalid one 
				is provided, then a valid cutetime attribute is assigned to the object.

			If the cutetime attribute is missing, then it is calculated from the text 
				of the provided object.
		
			If neither cutetime attibute nor valid object text exist then the 
				timestamp is assumed to by 'now'.

	**********************************************************************************/
	function get_time_value(obj) {
		var time_value = Number.NaN;

		var time_string = get_cutetime_attr(obj); // returns string or NULL
		if (time_string != null) {
			time_value = date_value(time_string);
		}

		if (isNaN(time_value)) {
			time_string = get_object_text(obj);
			if (time_string != null) {
				time_value = date_value(time_string);
			}
		}

		// if nothing valid available then set time to RIGHT NOW
		if (isNaN(time_value)) {
			time_string = new Date().toString();
			time_value = date_value(time_string);
		}

		// update cutetime attribute and return the time_value
		set_cutetime_attr(time_string, obj);
		return time_value;
	}


	/**********************************************************************************

		FUNCTION
			get_cutetime_attr

		DESCRIPTION
			returns the found value of the cutetime attribute of the specified object
			or NULL

	**********************************************************************************/
	function get_cutetime_attr(obj) {
		var return_value = obj.attr(TS_ATTR);

		if (return_value != undefined) {
			return return_value;
		} else {
			return null;
		}
	}


	/**********************************************************************************

		FUNCTION
			set_cutetime_attr

		DESCRIPTION
			sets / updates the cutetime attribute of the object

			the cuteime attribute is set to be STARTING point against which all
			future updates are measured against

	**********************************************************************************/
	function set_cutetime_attr(attr, obj) {
		// assume valid attr(ibute) value
		obj.attr(TS_ATTR, attr);
	}


	/**********************************************************************************

		FUNCTION
			get_object_text

		DESCRIPTION
			returns the text associated with the specified object (if any)

	**********************************************************************************/
	function get_object_text(obj) {
		return obj.text();
	}

})(jQuery);
