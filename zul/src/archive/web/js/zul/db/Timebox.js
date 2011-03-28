/* Timebox.zul

	Purpose:
		testing textbox.intbox.spinner,timebox,doublebox,longbox and decimalbox on zk5
	Description:

	History:
		Thu June 11 10:17:24     2009, Created by kindalu

Copyright (C) 2009 Potix Corporation. All Rights Reserved.

This program is distributed under LGPL Version 3.0 in the hope that
it will be useful, but WITHOUT ANY WARRANTY.
*/
(function () {
	function _checkFormat(fmt) {
		var error, out = [];
		for (var i = 0, l = fmt.length; i < l; i++) {
			var c = fmt.charAt(i);
			switch (c) {
			case 'K':
			case 'h':
			case 'H':
			case 'k':
			case 'm':
			case 's':
				if (fmt.charAt(i+1) == c)
					i++;
				else
					error = true;
				out.push(c + c);
				break;
			default:
				out.push(c);
			}
		}
		if (error)
			return zk.fmt.Text.format(msgzul.DATE_REQUIRED + out.join(''));
	}

	var LEGAL_CHARS = 'ahKHksm',
		/*constant for MINUTE (m) field alignment.
		 * @type int
		 */
		MINUTE_FIELD = 1,
		/*constant for SECOND (s) field alignment.
		 * @type int
		 */
		SECOND_FIELD = 2,
		/*constant for AM_PM (a) field alignment.
		 * @type int
		 */
		AM_PM_FIELD = 3,
		/*constant for HOUR0 (H) field alignment. (Hour in day (0-23))
		 * @type int
		 */
		HOUR0_FIELD = 4,
		/*constant for HOUR1 (k) field alignment. (Hour in day (1-24))
		 * @type int
		 */
		HOUR1_FIELD = 5,
		/*constant for HOUR2 (h) field alignment. (Hour in am/pm (1-12))
		 * @type int
		 */
		HOUR2_FIELD = 6,
		/*constant for HOUR3 (K) field alignment. (Hour in am/pm (0-11))
		 * @type int
		 */
		HOUR3_FIELD = 7;
	function _updFormat(wgt, fmt) {
		var index = [];
		for (var i = 0, l = fmt.length; i < l; i++) {
			var c = fmt.charAt(i);
			switch (c) {
			case 'a':
				var len = zk.APM[0].length;
				index.push(new zul.inp.AMPMHandler([i, i + len - 1], AM_PM_FIELD));
				break;
			case 'K':
				var start = i,
					end = fmt.charAt(i+1) == 'K' ? ++i : i;
				index.push(new zul.inp.HourHandler2([start, end], HOUR3_FIELD));
				break;
			case 'h':
				var start = i,
					end = fmt.charAt(i+1) == 'h' ? ++i : i;
				index.push(new zul.inp.HourHandler([start, end], HOUR2_FIELD));
				break;
			case 'H':
				var start = i,
					end = fmt.charAt(i+1) == 'H' ? ++i : i;
				index.push(new zul.inp.HourInDayHandler([start, end], HOUR0_FIELD));
				break;;
			case 'k':
				var start = i,
					end = fmt.charAt(i+1) == 'k' ? ++i : i;
				index.push(new zul.inp.HourInDayHandler2([start, end], HOUR1_FIELD));
				break;
			case 'm':
				var start = i,
					end = fmt.charAt(i+1) == 'm' ? ++i : i;
				index.push(new zul.inp.MinuteHandler([start, end], MINUTE_FIELD));
				break;
			case 's':
				var start = i,
					end = fmt.charAt(i+1) == 's' ? ++i : i;
				index.push(new zul.inp.SecondHandler([start, end], SECOND_FIELD));
				break;
			default:
				var ary = [],
					start = i,
					end = i;

				while ((ary.push(c)) && ++end < l) {
					c = fmt.charAt(end);
					if (LEGAL_CHARS.indexOf(c) != -1) {
						end--;
						break;
					}
				}
				index.push({index: [start, end], format: (function (text) {
					return function() {
						return text;
					};
				})(ary.join(''))});
				i = end;
			}
		}
		for (var shift, i = 0, l = index.length; i < l; i++) {
			if (index[i].type == AM_PM_FIELD) {
				shift = index[i].index[1] - index[i].index[0];
				if (!shift) break; // no need to shift.
			} else if (shift) {
				index[i].index[0] += shift;
				index[i].index[1] += shift;
			}
		}
		wgt._fmthdler = index;
	}
	function _cleanSelectionText (wgt, startHandler) {
		var inp = wgt.getInputNode(),
			sel = zk(inp).getSelectionRange(),
			pos = sel[0],
			selEnd = sel[1],
			fmthdler = wgt._fmthdler,
			index = fmthdler.$indexOf(startHandler),
			text = [],
			prevStart = pos,
			hdler = startHandler,
			ofs, hStart, hEnd;
		
		//restore separator
		do {
			hStart = hdler.index[0];
			hEnd = hdler.index[1] + 1;
			//latest one
			if (hEnd >= selEnd && hdler.type) {
				ofs = selEnd - hStart;
				while (ofs-- > 0) //replace by space (after)
					text.push(' ');
				break;
			}
			
			if (hdler.type) {
				//the first one using pos
				prevStart = Math.max(hStart, prevStart);
				continue;
			}
			ofs = hStart - prevStart;
			while (ofs-- > 0) //replace by space (before)
				text.push(' ');
									
			text.push(hdler.format());
			
		} while (hdler = fmthdler[++index]);
		return text.join('');
	}
	
	function _getMaxLen (wgt) {
		var f = wgt._fmthdler,
			date = wgt.getValue(),
			len = 0;
		for (var i = 0, l = f.length; i < l; i++)
			len += f[i].format(date).length;
		return len;
	}

/**
 * An input box for holding a time (a Date Object, but only Hour & Minute are used.
 *
 * <p>Default {@link #getZclass}: z-timebox.
 *
 * <p>timebox doens't support customized format. It support HH:mm formate, where HH is hour of day and mm is minute of hour.
 * 
 * <p>Like {@link zul.inp.Combobox} and {@link zul.db.Datebox},
 * the value of a read-only time box ({@link #isReadonly}) can be changed
 * by clicking the up or down button (though users cannot type anything
 * in the input box).
 *
 */
zul.db.Timebox = zk.$extends(zul.inp.FormatWidget, {
	_buttonVisible: true,
	_format: 'HH:mm',
	$init: function() {
		this.$supers('$init', arguments);
		_updFormat(this, this._format);
	},
	$define: {
		/** Returns whether the button (on the right of the textbox) is visible.
		 * <p>Default: true.
		 * @return boolean
		 */
		/** Sets whether the button (on the right of the textbox) is visible.
		 * @param boolean buttonVisible
		 */
		buttonVisible: function(v){
			var n = this.$n('btn'),
				zcls = this.getZclass();
			if (n) {
				if (!this.inRoundedMold()) {
					jq(n)[v ? 'show': 'hide']();
					jq(this.getInputNode())[v ? 'removeClass': 'addClass'](zcls + '-right-edge');
				} else {
					var fnm = v ? 'removeClass': 'addClass';
					jq(n)[fnm](zcls + '-btn-right-edge');
					
					if (zk.ie6_) {
						jq(n)[fnm](zcls + 
							(this._readonly ? '-btn-right-edge-readonly': '-btn-right-edge'));
						
						if (jq(this.getInputNode()).hasClass(zcls + "-text-invalid"))
							jq(n)[fnm](zcls + "-btn-right-edge-invalid");
					}
				}
				this.onSize();
			}
		}
	},
	setFormat: function (fmt) {
		_updFormat(this, fmt);
		this.$supers('setFormat', arguments);
	},
	coerceToString_: function (date) {
		if (!this._changed && !date && arguments.length) return '';
		var out = [];
		for (var i = 0, f = this._fmthdler, l = f.length; i < l; i++)
			out.push(f[i].format(date));
		return out.join('');
	},
	coerceFromString_: function (val) {
		if (!val) return null;

		var error;
		if ((error = _checkFormat(this._format)))
			return {error: error};

		var date = zUtl.today(this._format),
			hasAM, isAM, hasHour1,
			fmt = [], emptyCount = 0;
		date.setSeconds(0);
		date.setMilliseconds(0);

		for (var i = 0, f = this._fmthdler, l = f.length; i < l; i++) {
			if (f[i].type == AM_PM_FIELD) {
				hasAM = true;
				isAM = f[i].unformat(date, val);
				if (!f[i].getText(val).trim().length)
					emptyCount++;
			} else if (f[i].type) {
				fmt.push(f[i]);
				if (!f[i].getText(val).trim().length)
					emptyCount++;
			}
		}
		
		if (fmt.length == 
			(hasAM ? --emptyCount: emptyCount)) {
			this._changed = false;//for return empty string
			return;
		}

		if (hasAM) {
			for (var i = 0, l = fmt.length; i < l; i++) {
				if (fmt[i].type == HOUR2_FIELD || fmt[i].type == HOUR3_FIELD) {
					hasHour1 = true;
					break;
				}
			}
		}

		if (hasHour1) {
			for (var i = 0, l = fmt.length; i < l; i++) {
				if (fmt[i].type != HOUR0_FIELD && fmt[i].type != HOUR1_FIELD)
					date = fmt[i].unformat(date, val, isAM);
			}
		} else {
			for (var i = 0, l = fmt.length; i < l; i++) {
				if (fmt[i].type != HOUR2_FIELD && fmt[i].type != HOUR3_FIELD)
					date = fmt[i].unformat(date, val);
			}
		}
		return date;
	},
	getZclass: function () {
		var zcls = this._zclass;
		return zcls != null ? zcls: "z-timebox" + (this.inRoundedMold() ? "-rounded": "");
	},
	onSize: _zkf = function () {
		var width = this.getWidth(),
			inp = this.getInputNode();
		if (!width || width.indexOf('%') != -1)
			inp.style.width = '';

		if (inp && this._value && !inp.value)
			inp.value = this.coerceToString_(this._value);

		this.syncWidth();
	},
	onShow: _zkf,
	onHide: zul.inp.Textbox.onHide,
	validate: zul.inp.Intbox.validate,
	doClick_: function(evt) {
		if (evt.domTarget == this.getInputNode())
			this._doCheckPos();
		this.$supers('doClick_', arguments);
	},
	doKeyPress_: function (evt) {
		if (zk.opera && evt.keyCode != 9) {
			evt.stop();
			return;
		}
		this.$supers('doKeyPress_', arguments);
	},
	doKeyDown_: function(evt) {
		var inp = this.getInputNode();
		if (inp.disabled || inp.readOnly)
			return;

		var code = evt.keyCode;
		switch(code){
		case 48:case 96://0
		case 49:case 97://1
		case 50:case 98://2
		case 51:case 99://3
		case 52:case 100://4
		case 53:case 101://5
		case 54:case 102://6
		case 55:case 103://7
		case 56:case 104://8
		case 57:case 105://9
			code = code - (code>=96?96:48);
			this._doType(code);
			evt.stop();
			return;
		case 35://end
			this.lastPos = inp.value.length;
			return;
		case 36://home
			this.lastPos = 0;
			return;
		case 37://left
			if (this.lastPos > 0)
				this.lastPos--;
			return;
		case 39://right
			if (this.lastPos < inp.value.length)
				this.lastPos++;
			return;
		case 38://up
			this._doUp();
			evt.stop();
			return;
		case 40://down
			this._doDown();
			evt.stop();
			return;
		case 46://del
			this._doDel();
			evt.stop();
			return;
		case 8://backspace
			this._doBack();
			evt.stop();
			return;
		case 9:
			// do nothing
			break
		case 13: case 27://enter,esc,tab
			break;
		default:
			if (!(code >= 112 && code <= 123) //F1-F12
			&& !evt.ctrlKey && !evt.altKey)
				evt.stop();
		}
		this.$supers('doKeyDown_', arguments);
	},
	_dodropbtnup: function (evt) {
		var zcls = this.getZclass();
		
		jq(this._currentbtn).removeClass(zcls + "-btn-clk");
		if (!this.inRoundedMold()) {
			jq(this._currentbtn).removeClass(zcls + "-btn-up-clk");
			jq(this._currentbtn).removeClass(zcls + "-btn-down-clk");
		}
		this.domUnlisten_(document.body, "onMouseup", "_dodropbtnup");
		this._currentbtn = null;
	},
	_btnDown: function(evt) {
		var isRounded = this.inRoundedMold();
		if (isRounded && !this._buttonVisible) return;
		
		var inp;
		if(!(inp = this.getInputNode()) || inp.disabled) return;
		
		var btn = this.$n("btn"),
			zcls = this.getZclass();
			
		if (this._currentbtn)
			this._dodropbtnup(evt);
		jq(btn).addClass(zcls + "-btn-clk");
		this.domListen_(document.body, "onMouseup", "_dodropbtnup");
		this._currentbtn = btn;

		if (!inp.value)
			inp.value = this.coerceToString_();
			
		var ofs = zk(btn).revisedOffset(),
			isOverUpBtn = (evt.pageY - ofs[1]) < btn.offsetHeight/2;
		if (isOverUpBtn) { //up
			this._doUp();
			this._startAutoIncProc(true);
		} else {
			this._doDown();
			this._startAutoIncProc(false);
		}
		
		var sfx = isRounded? "" : 
					isOverUpBtn? "-up":"-down";
		if ((btn = this.$n("btn" + sfx)) && !isRounded) {
			jq(btn).addClass(zcls + "-btn" + sfx + "-clk");
			this._currentbtn = btn;
		}
		
		// cache it for IE
		this._lastPos = this._getPos();
		this._changed = true;
		
		zk.Widget.mimicMouseDown_(this); //set zk.currentFocus
		zk(inp).focus(); //we have to set it here; otherwise, if it is in popup of
			//datebox, datebox's onblur will find zk.currentFocus is null

		// disable browser's text selection
		evt.stop();
	},
	_btnUp: function(evt) {
		if (this.inRoundedMold() && !this._buttonVisible) return;

		var inp = this.getInputNode();
		if(inp.disabled || zk.dragging) return;

		if (zk.opera) zk(inp).focus();
			//unfortunately, in opera, it won't gain focus if we set in _btnDown

		this._onChanging();
		this._stopAutoIncProc();
		
		if ((zk.ie || zk.safari) && this._lastPos)
			zk(inp).setSelectionRange(this._lastPos, this._lastPos);
	},
	_btnOut: function(evt) {
		if (this.inRoundedMold() && !this._buttonVisible) return;
		var inp = this.getInputNode();
		if(!inp || inp.disabled || zk.dragging) return;

		jq(this.$n("btn")).removeClass(this.getZclass()+"-btn-over");
		this._stopAutoIncProc();
	},
	_btnOver: function(evt) {
		if (this.inRoundedMold() && !this._buttonVisible) return;
		if (this.getInputNode() && !this.getInputNode().disabled && !zk.dragging)
			jq(this.$n("btn")).addClass(this.getZclass()+"-btn-over");
	},
	_getPos: function () {
		return zk(this.getInputNode()).getSelectionRange()[0];
	},
	_doCheckPos: function () {
		this.lastPos = this._getPos();
	},
	_doUp: function() {
		this._changed = true;
		this.getTimeHandler().increase(this, 1);
		this._onChanging();
	},
	_doDown: function() {
		this._changed = true;
		this.getTimeHandler().increase(this, -1);
		this._onChanging();
	},
	_doBack: function () {
		this._changed = true;
		this.getTimeHandler().deleteTime(this, true);
	},
	_doDel: function () {
		this._changed = true;
		this.getTimeHandler().deleteTime(this, false);
	},
	_doType: function (val) {
		this._changed = true;
		this.getTimeHandler().addTime(this, val);
	},
	getTimeHandler: function () {
		var pos = zk(this.getInputNode()).getSelectionRange()[0];
		for (var i = 0, f = this._fmthdler, l = f.length; i < l; i++) {
			if (!f[i].type) continue;
			if (f[i].index[0] <= pos && f[i].index[1] + 1 >= pos)
				return f[i];
		}
		return this._fmthdler[0];
	},
	getNextTimeHandler: function (th) {
		var f = this._fmthdler,
			index = f.$indexOf(th),
			lastHandler;
			
		while ((lastHandler = f[++index]) &&
			(!lastHandler.type || lastHandler.type == AM_PM_FIELD));
		
		return lastHandler;
	},
	_startAutoIncProc: function(up) {
		if (this.timerId)
			clearInterval(this.timerId);
		var self = this,
			fn = up ? '_doUp' : '_doDown';
		this.timerId = setInterval(function() {
			if ((zk.ie || zk.safari) && self._lastPos)
				zk(self.getInputNode()).setSelectionRange(self._lastPos, self._lastPos);
			self[fn]();
		}, 300);
	},
	_stopAutoIncProc: function() {
		if (this.timerId)
			clearTimeout(this.timerId);
		this.currentStep = this.defaultStep;
		this.timerId = null;
	},
	/** Synchronizes the input element's width of this component
	 */
	syncWidth: function () {
		var node = this.$n();
		if (!zk(node).isRealVisible() || (!this._inplace && !node.style.width))
			return;
		
		var inp = this.getInputNode(),
    		$n = jq(node),
    		$inp = jq(inp),
    		inc = this.getInplaceCSS(),
    		shallClean = !node.style.width && this._inplace;
		if (this._buttonVisible && shallClean) {
			$n.removeClass(inc);
			$inp.removeClass(inc);
			
			if (zk.opera)
				node.style.width = jq.px0(zk(node).revisedWidth(node.clientWidth) + zk(node).borderWidth());
			else
				node.style.width = jq.px0(zk(node).revisedWidth(node.offsetWidth));
			$n.addClass(inc);
			$inp.addClass(inc);
		}
		var extraWidth = this.inRoundedMold() && shallClean;
		
		if (extraWidth) {
    		$n.removeClass(inc);
    		$inp.removeClass(inc);
		}
		if (zk.ie6_)			
			inp.style.width = jq.px(0);
		var width = zk.opera ? zk(node).revisedWidth(node.clientWidth) + zk(node).borderWidth()
							 : zk(node).revisedWidth(node.offsetWidth),
			btn = this.$n('btn');
		
		if (extraWidth) {
    		$n.addClass(inc);
    		$inp.addClass(inc);
		}
		inp.style.width = jq.px0(zk(inp).revisedWidth(width - (btn ? btn.offsetWidth : 0)));
	},
	doFocus_: function (evt) {
		var n = this.$n(),
			inp = this.getInputNode(),
			selrng = zk(inp).getSelectionRange();
		if (this._inplace)
			n.style.width = jq.px0(zk(n).revisedWidth(n.offsetWidth));

		this.$supers('doFocus_', arguments);	

		if (!inp.value)
			inp.value = this.coerceToString_();

		this._doCheckPos();
		
		// Bug 2688620
		if (selrng[0] !== selrng[1]) {
			zk(inp).setSelectionRange(selrng[0], selrng[1]);
			this.lastPos = selrng[1];
		}
		if (this._inplace) {
			if (jq(n).hasClass(this.getInplaceCSS())) {
				jq(n).removeClass(this.getInplaceCSS());
				this.onSize();
			}
		}
	},
	doBlur_: function (evt) {
		var n = this.$n();
		if (this._inplace && this._inplaceout)
			n.style.width = jq.px0(zk(n).revisedWidth(n.offsetWidth));

		// skip onchange, Bug 2936568
		if (!this._value && !this._changed)
			this.getInputNode().value = this._lastRawValVld = '';

		this.$supers('doBlur_', arguments);

		if (this._inplace && this._inplaceout) {
			jq(n).addClass(this.getInplaceCSS());
			this.onSize();
			n.style.width = this.getWidth() || '';
		}
	},
	afterKeyDown_: function (evt) {
		if (this._inplace)
			jq(this.$n()).toggleClass(this.getInplaceCSS(),  evt.keyCode == 13 ? null : false);

		this.$supers('afterKeyDown_', arguments);
	},
	bind_: function () {
		this.$supers(zul.db.Timebox, 'bind_', arguments);
		var inp = this.getInputNode(),
			btn = this.$n("btn");
		zWatch.listen({onSize: this, onShow: this});

		if (this._inplace)
			jq(inp).addClass(this.getInplaceCSS());

		if (btn) {
			this.domListen_(btn, "onMouseDown", "_btnDown")
				.domListen_(btn, "onMouseUp", "_btnUp")
				.domListen_(btn, "onMouseOut", "_btnOut")
				.domListen_(btn, "onMouseOver", "_btnOver");
		}
		this.syncWidth();
	},
	unbind_: function () {
		if(this.timerId){
			clearTimeout(this.timerId);
			this.timerId = null;
		}
		zWatch.unlisten({onSize: this, onShow: this});
		var btn = this.$n("btn");
		if (btn) {
			this.domUnlisten_(btn, "onMouseDown", "_btnDown")
				.domUnlisten_(btn, "onMouseUp", "_btnUp")
				.domUnlisten_(btn, "onMouseOut", "_btnOut")
				.domUnlisten_(btn, "onMouseOver", "_btnOver");
		}
		this._changed = false;
		this.$supers(zul.db.Timebox, 'unbind_', arguments);
	}

});
zul.inp.TimeHandler = zk.$extends(zk.Object, {
	maxsize: 59,
	minsize: 0,
	digits: 2,
	$init: function (index, type) {
		this.index = index;
		this.type = type;
	},
	format: function (date) {
		return '00';
	},
	unformat: function (date, val) {
		return date;
	},
	increase: function (wgt, up) {
		var inp = wgt.getInputNode(),
			start = this.index[0],
			end = this.index[1] + 1,
			val = inp.value,
			text = val.substring(start, end);

		text = zk.parseInt(text.replace(/ /g, '0'));
		text += up;
		var max = this.maxsize + 1;
		if (text < this.minsize)
			text = this.maxsize;
		else if (text >= max)
			text = this.minsize;

		if (/* TODO: this.digits == 2 && */text < 10) text = "0" + text;
		inp.value = val.substring(0, start) + text + val.substring(end);

		zk(inp).setSelectionRange(start, end);
	},
	deleteTime: function (wgt, backspace) {
		var inp = wgt.getInputNode(),
			sel = zk(inp).getSelectionRange(),
			pos = sel[0],
			val = inp.value,
			maxLength = _getMaxLen(wgt);
		
		// clean over text	
		if (val.length > maxLength) {
			val = inp.value = val.substr(0, maxLength);
			sel = [Math.min(sel[0], maxLength), Math.min(sel[1], maxLength)];
			pos = sel[0];
		}
		
		if (pos != sel[1]) { 
			//select delete
			inp.value = val.substring(0, pos) + _cleanSelectionText(wgt, this)
							+ val.substring(sel[1]);
		} else {
			var fmthdler = wgt._fmthdler,
				index = fmthdler.$indexOf(this),
				ofs = backspace? -1: 1,
				ofs2 = backspace? 0: 1,
				hdlerPos = this.index[ofs2] + ofs2,
				hdler;
			ofs2 = backspace? 1: 0;
			if (pos == hdlerPos) {// on start or end
				//delete sibling handler
				if (hdler = fmthdler[index + ofs * 2]) {
					hdlerPos = hdler.index[ofs2] + ofs2;
					pos = hdlerPos + ofs;
					inp.value = val.substring(0, pos + ofs2-1) + ' '
						+ val.substring(pos + ofs2);
				}
			} else {// delete self
				pos += ofs;					
				inp.value = val.substring(0, pos + ofs2-1) + ' '
					+ val.substring(pos + ofs2);
			}
		}
		zk(inp).setSelectionRange(pos, pos);
	},
	_addNextTime: function (wgt, num) {
		var inp = wgt.getInputNode(),
			index, NTH;
		if (NTH = wgt.getNextTimeHandler(this)) {
			index = NTH.index[0];
			zk(inp).setSelectionRange(index, 
				Math.max(index, 
					zk(inp).getSelectionRange()[1]));
			NTH.addTime(wgt, num);
		}
	},
	addTime: function (wgt, num) {
		var inp = wgt.getInputNode(),
			sel = zk(inp).getSelectionRange(),
			val = inp.value,
			pos = sel[0],
			maxLength = _getMaxLen(wgt);
			
		// clean over text	
		if (val.length > maxLength) {
			val = inp.value = val.substr(0, maxLength);
			sel = [Math.min(sel[0], maxLength), Math.min(sel[1], maxLength)];
			pos = sel[0];
		}
		
		if (pos == maxLength)
			return;
		
		// first number (hendle max bound)
		if (pos == this.index[0]) {
			var i;
			if ((i = zk.parseInt(num + '0')) > this.maxsize) {
				val = inp.value = val.substring(0, pos) + '00'
					+ val.substring(pos + 2);
				zk(inp).setSelectionRange(++pos, Math.max(sel[1], pos));
				sel = zk(inp).getSelectionRange();
			}
		} else if (pos == (this.index[1] + 1)) {
			//end of handler
			this._addNextTime(wgt, num);
			return;
		}
		
		if (pos != sel[1]) {
			//select edit
			inp.value = val.substring(0, pos++) + num 
				+ _cleanSelectionText(wgt, this).substring(1)
				+ val.substring(sel[1]);
		} else {
			inp.value = val.substring(0, pos) 
				+ num + val.substring(++pos);
		}
		wgt.lastPos = pos;
		zk(inp).setSelectionRange(pos, pos);
	},
	getText: function (val) {
		var start = this.index[0],
			end = this.index[1] + 1;
		return val.substring(start, end);
	}
});
zul.inp.HourInDayHandler = zk.$extends(zul.inp.TimeHandler, {
	maxsize: 23,
	minsize: 0,
	format: function (date) {
		if (!date) return '00';
		else {
			var h = date.getHours();
			if (h < 10)
				h = '0' + h;
			return h.toString();
		}
	},
	unformat: function (date, val) {
		date.setHours(zk.parseInt(this.getText(val)));
		return date;
	}
});
zul.inp.HourInDayHandler2 = zk.$extends(zul.inp.TimeHandler, {
	maxsize: 24,
	minsize: 1,
	format: function (date) {
		if (!date) return '24';
		else {
			var h = date.getHours();
			if (h == 0)
				h = '24';
			else if (h < 10)
				h = '0' + h;
			return h.toString();
		}
	},
	unformat: function (date, val) {
		var hours = zk.parseInt(this.getText(val));
		if (hours == 24)
			hours = 0;
		date.setHours(hours);
		return date;
	}
});
zul.inp.HourHandler = zk.$extends(zul.inp.TimeHandler, {
	maxsize: 12,
	minsize: 1,
	format: function (date) {
		if (!date) return '12';
		else {
			var h = date.getHours();
			h = (h % 12);
			if (h == 0)
				h = '12';
			else if (h < 10)
				h = '0' + h;
			return h.toString();
		}
	},
	unformat: function (date, val, am) {
		var hours = zk.parseInt(this.getText(val));
		if (hours == 12)
			hours = 0;
		date.setHours(am ? hours : hours + 12);
		return date;
	}
});
zul.inp.HourHandler2 = zk.$extends(zul.inp.TimeHandler, {
	maxsize: 11,
	minsize: 0,
	format: function (date) {
		if (!date) return '00';
		else {
			var h = date.getHours();
			h = (h % 12);
			if (h < 10)
				h = '0' + h;
			return h.toString();
		}
	},
	unformat: function (date, val, am) {
		var hours = zk.parseInt(this.getText(val));
		date.setHours(am ? hours : hours + 12);
		return date;
	}
});
zul.inp.MinuteHandler = zk.$extends(zul.inp.TimeHandler, {
	format: function (date) {
		if (!date) return '00';
		else {
			var m = date.getMinutes();
			if (m < 10)
				m = '0' + m;
			return m.toString();
		}
	},
	unformat: function (date, val) {
		date.setMinutes(zk.parseInt(this.getText(val)));
		return date;
	}
});
zul.inp.SecondHandler = zk.$extends(zul.inp.TimeHandler, {
	format: function (date) {
		if (!date) return '00';
		else {
			var s = date.getSeconds();
			if (s < 10)
				s = '0' + s;
			return s.toString();
		}
	},
	unformat: function (date, val) {
		date.setSeconds(zk.parseInt(this.getText(val)));
		return date;
	}
});
zul.inp.AMPMHandler = zk.$extends(zul.inp.TimeHandler, {
	format: function (date) {
		if (!date)
			return zk.APM[0];
		var h = date.getHours();
		return zk.APM[h < 12 ? 0 : 1];
	},
	unformat: function (date, val) {
		var text = this.getText(val).trim();
		return (text.length == zk.APM[0].length) ? 
			zk.APM[0] == text : true;
	},
	addTime: function (wgt, num) {
		var inp = wgt.getInputNode(),
			start = this.index[0],
			end = this.index[1] + 1,
			val = inp.value,
			text = val.substring(start, end);
		//restore A/PM text
		if (text != zk.APM[0] && text != zk.APM[1]) {
			text = zk.APM[0];
			inp.value = val.substring(0, start) + text + val.substring(end);
		}
		this._addNextTime(wgt, num);
	},
	increase: function (wgt, up) {
		var inp = wgt.getInputNode(),
			start = this.index[0],
			end = this.index[1] + 1,
			val = inp.value,
			text = val.substring(start, end);

		text = zk.APM[0] == text ? zk.APM[1] : zk.APM[0];
		inp.value = val.substring(0, start) + text + val.substring(end);
		zk(inp).setSelectionRange(start, end);
	}
});

})();