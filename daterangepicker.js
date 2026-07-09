/**
 * DateRangePicker - componente reutilizable de selector de rango de fechas.
  * Sin dependencias externas. Compatible con proyectos vanilla JS.
   */
(function (global) {
    'use strict';

    const LOCALES = {
          es: {
                  months: ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'],
                          weekdays: ['L','M','X','J','V','S','D'],
                                  weekStartsOn: 1,
                  goTo: 'Ir a',
                  of: 'de',
                  presetsTitle: 'VALORES PREESTABLECIDOS',
                  granularityTitle: 'GRANULARIDAD',
                  hintStart: 'Selecciona una fecha de inicio',
                  hintEnd: 'Selecciona una fecha final',
                  cancel: 'Cancelar',
                  apply: 'Aplicar',
                  presets: {
                            custom: 'Intervalo actual', hoy: 'Hoy', ayer: 'Ayer',
                            semana: 'Esta semana', semana_pasada: 'Semana pasada',
                            ult7: 'Ultimos 7 dias', mes: 'Este mes',
                            mes_pasado: 'Mes pasado', ult30: 'Ultimos 30 dias'
                  },
                          granularity: { intervalo: 'Intervalo', dia: 'Dia', semana: 'Semana', mes: 'Mes' }
          },
                en: {
                        months: ['January','February','March','April','May','June','July','August','September','October','November','December'],
                                weekdays: ['M','T','W','T','F','S','S'],
                                        weekStartsOn: 1,
                        goTo: 'Go to',
                        of: '',
                        presetsTitle: 'PRESET RANGES',
                        granularityTitle: 'GRANULARITY',
                        hintStart: 'Select a start date',
                        hintEnd: 'Select an end date',
                        cancel: 'Cancel',
                        apply: 'Apply',
                        presets: {
                                  custom: 'Current range', hoy: 'Today', ayer: 'Yesterday',
                                  semana: 'This week', semana_pasada: 'Last week',
                                  ult7: 'Last 7 days', mes: 'This month',
                                  mes_pasado: 'Last month', ult30: 'Last 30 days'
                        },
                                granularity: { intervalo: 'Range', dia: 'Day', semana: 'Week', mes: 'Month' }
                }
    };

  const pad = n => String(n).padStart(2, '0');
  const toISO = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseISO = s => { const parts = s.split('-').map(Number); return new Date(parts[0], parts[1] - 1, parts[2]); };
  const sameDay = (a, b) => a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const addDays = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };
  const addMonths = (d, n) => { const r = new Date(d); r.setDate(1); r.setMonth(r.getMonth() + n); return r; };
  const startOfMonth = d => new Date(d.getFullYear(), d.getMonth(), 1);
  const endOfMonth = d => new Date(d.getFullYear(), d.getMonth() + 1, 0);

  function startOfWeekMon(d) {
    const r = new Date(d);
    const day = (r.getDay() + 6) % 7;
    r.setDate(r.getDate() - day);
    return r;
  }

  let instanceCounter = 0;

  class DateRangePicker {
    constructor(container, opts) {
      if (!opts) opts = {};
      this.el = typeof container === 'string' ? document.querySelector(container) : container;
      if (!this.el) throw new Error('DateRangePicker: contenedor no encontrado');

      this.opts = Object.assign({
        locale: 'es',
        minDate: null,
        maxDate: null,
        format: 'YYYY-MM-DD',
        start: null,
        end: null,
        presets: null,
        now: function () { return new Date(); },
          onApply: function () {},
            onCancel: function () {}
      }, opts);

      this.L = LOCALES[this.opts.locale] || LOCALES.es;
      this.id = 'drp-' + (++instanceCounter);

      const initStart = this.opts.start ? parseISO(this.opts.start) : null;
      const initEnd = this.opts.end ? parseISO(this.opts.end) : null;

      this.state = {
        start: initStart,
        end: initEnd,
        picking: initStart && !initEnd ? 'end' : 'start',
        granularity: 'intervalo',
        activePreset: 'custom',
        viewDate: startOfMonth(initStart || this.opts.now()),
        open: false
      };

      this._buildPresets();
      this._render();
      this._bindGlobalEvents();
    }

    _buildPresets() {
      const now = this.opts.now();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = addDays(today, -1);
      const thisWeekStart = startOfWeekMon(today);
      const lastWeekStart = addDays(thisWeekStart, -7);
      const lastWeekEnd = addDays(thisWeekStart, -1);
      const monthStart = startOfMonth(today);
      const lastMonthStart = startOfMonth(addMonths(today, -1));
      const lastMonthEnd = endOfMonth(addMonths(today, -1));

      const defaults = [
        { key: 'custom', range: null },
        { key: 'hoy', range: [today, today] },
        { key: 'ayer', range: [yesterday, yesterday] },
        { key: 'semana', range: [thisWeekStart, today] },
        { key: 'semana_pasada', range: [lastWeekStart, lastWeekEnd] },
        { key: 'ult7', range: [addDays(today, -6), today] },
        { key: 'mes', range: [monthStart, today] },
        { key: 'mes_pasado', range: [lastMonthStart, lastMonthEnd] },
        { key: 'ult30', range: [addDays(today, -29), today] }
        ];

      this.presets = this.opts.presets || defaults;
    }

    _render() {
      this.el.classList.add('drp-wrap');
      const label = this._currentLabel();
      this.el.innerHTML = '<button type="button" class="drp-trigger" aria-haspopup="dialog" aria-expanded="false">'
        + '<span class="drp-trigger-icon">' + String.fromCodePoint(128197) + '</span>'
        + '<span class="drp-trigger-label">' + label + '</span>'
        + '</button>'
        + '<div class="drp-panel" role="dialog" aria-modal="true" aria-label="' + this.L.presetsTitle + '">'
        + '<div class="drp-sidebar">'
        + '<div class="drp-sidebar-title">' + this.L.presetsTitle + '</div>'
        + '<ul class="drp-presets" role="listbox"></ul>'
        + '<div class="drp-divider"></div>'
        + '<div class="drp-sidebar-title">' + this.L.granularityTitle + '</div>'
        + '<ul class="drp-granularity" role="radiogroup" aria-label="' + this.L.granularityTitle + '"></ul>'
        + '</div>'
        + '<div class="drp-body">'
        + '<div class="drp-nav">'
        + '<span class="drp-nav-label">' + this.L.goTo + '</span>'
        + '<select class="drp-select" data-role="month" aria-label="mes"></select>'
        + '<select class="drp-select" data-role="year" aria-label="anio"></select>'
        + '<button type="button" class="drp-arrow drp-arrow-prev" aria-label="Mes anterior">' + String.fromCharCode(8249) + '</button>'
        + '<button type="button" class="drp-arrow drp-arrow-next" aria-label="Mes siguiente">' + String.fromCharCode(8250) + '</button>'
        + '</div>'
        + '<div class="drp-calendars"></div>'
        + '<div class="drp-footer">'
        + '<span class="drp-hint"></span>'
        + '<div class="drp-actions">'
        + '<button type="button" class="drp-btn drp-btn-cancel">' + this.L.cancel + '</button>'
        + '<button type="button" class="drp-btn drp-btn-apply">' + this.L.apply + '</button>'
        + '</div>'
        + '</div>'
        + '</div>'
        + '</div>';

      this.$trigger = this.el.querySelector('.drp-trigger');
      this.$panel = this.el.querySelector('.drp-panel');
      this.$presets = this.el.querySelector('.drp-presets');
      this.$gran = this.el.querySelector('.drp-granularity');
      this.$monthSel = this.el.querySelector('[data-role="month"]');
      this.$yearSel = this.el.querySelector('[data-role="year"]');
      this.$calendars = this.el.querySelector('.drp-calendars');
      this.$hint = this.el.querySelector('.drp-hint');

      this._renderPresets();
      this._renderGranularity();
      this._renderNavSelects();
      this._renderCalendars();
      this._updateHint();
      this._bindLocalEvents();
    }

    _renderPresets() {
      const state = this.state, L = this.L;
      this.$presets.innerHTML = this.presets.map(function (p) {
        const activeCls = state.activePreset === p.key ? ' active' : '';
        const sel = state.activePreset === p.key;
        return '<li role="option" tabindex="0" data-key="' + p.key + '" class="drp-preset' + activeCls + '" aria-selected="' + sel + '">' + (L.presets[p.key] || p.key) + '</li>';
      }).join('');
    }

    _renderGranularity() {
      const state = this.state, L = this.L;
      const keys = ['intervalo', 'dia', 'semana', 'mes'];
      this.$gran.innerHTML = keys.map(function (k) {
        const activeCls = state.granularity === k ? ' active' : '';
        const checked = state.granularity === k;
        return '<li role="radio" tabindex="0" data-gran="' + k + '" class="drp-gran' + activeCls + '" aria-checked="' + checked + '">' + L.granularity[k] + '</li>';
      }).join('');
    }

    _renderNavSelects() {
      const v = this.state.viewDate, L = this.L;
      this.$monthSel.innerHTML = L.months.map(function (m, i) {
        return '<option value="' + i + '" ' + (i === v.getMonth() ? 'selected' : '') + '>' + m + '</option>';
      }).join('');
      const curYear = v.getFullYear();
      const years = [];
      for (let y = curYear - 6; y <= curYear + 6; y++) years.push(y);
      this.$yearSel.innerHTML = years.map(function (y) {
        return '<option value="' + y + '" ' + (y === curYear ? 'selected' : '') + '>' + y + '</option>';
      }).join('');
    }

    _renderCalendars() {
      const left = this.state.viewDate;
      const right = addMonths(left, 1);
      this.$calendars.innerHTML = this._monthTable(left, 0) + this._monthTable(right, 1);
      const self = this;
      this.$calendars.querySelectorAll('.drp-day:not(.muted):not(.disabled)').forEach(function (cell) {
        cell.addEventListener('click', function () { self._onDayClick(cell.dataset.date); });
        cell.addEventListener('keydown', function (e) { self._onDayKeydown(e, cell); });
      });
    }

    _monthTable(monthDate, calIndex) {
      const L = this.L;
      const first = startOfMonth(monthDate);
      const last = endOfMonth(monthDate);
      const gridStart = startOfWeekMon(first);
      const totalCells = Math.ceil((last.getDate() + ((first.getDay() + 6) % 7)) / 7) * 7;

      let rows = '', cursor = new Date(gridStart);
      for (let i = 0; i < totalCells; i++) {
        if (i % 7 === 0) rows += '<tr>';
        const inMonth = cursor.getMonth() === monthDate.getMonth();
        const iso = toISO(cursor);
        const disabled = (this.opts.minDate && cursor < this.opts.minDate) || (this.opts.maxDate && cursor > this.opts.maxDate);
        const isToday = sameDay(cursor, this.opts.now());
        const isStart = sameDay(cursor, this.state.start);
        const isEnd = sameDay(cursor, this.state.end);
        const inRange = this.state.start && this.state.end && cursor > this.state.start && cursor < this.state.end;

        let cls = 'drp-day';
        if (!inMonth) cls += ' muted';
        if (disabled) cls += ' disabled';
        if (isToday) cls += ' today';
        if (inRange) cls += ' in-range';
        if (isStart) cls += ' range-start';
        if (isEnd) cls += ' range-end';

        rows += '<td><span class="' + cls + '" data-date="' + iso + '" tabindex="' + (inMonth && !disabled ? '0' : '-1') + '" role="gridcell" aria-selected="' + (isStart || isEnd) + '" aria-label="' + cursor.getDate() + ' ' + L.months[cursor.getMonth()] + '">' + cursor.getDate() + '</span></td>';
        if (i % 7 === 6) rows += '</tr>';
        cursor = addDays(cursor, 1);
      }

      const headCells = L.weekdays.map(function (w) { return '<th scope="col">' + w + '</th>'; }).join('');
      return '<table class="drp-cal" data-cal="' + calIndex + '"><caption>' + L.months[monthDate.getMonth()] + ' ' + L.of + ' ' + monthDate.getFullYear() + '</caption><thead><tr>' + headCells + '</tr></thead><tbody>' + rows + '</tbody></table>';
    }

    _onDayClick(iso) {
      const d = parseISO(iso);
      if (this.state.picking === 'start' || !this.state.start || (this.state.start && this.state.end)) {
        this.state.start = d; this.state.end = null; this.state.picking = 'end';
      } else {
        if (d < this.state.start) { this.state.end = this.state.start; this.state.start = d; }
        else { this.state.end = d; }
        this.state.picking = 'start';
      }
      this.state.activePreset = 'custom';
      this._renderPresets();
      this._renderCalendars();
      this._updateHint();
    }

    _onDayKeydown(e, cell) {
      const map = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 7, ArrowUp: -7 };
      const dir = map[e.key];
      if (dir) {
        e.preventDefault();
        const next = addDays(parseISO(cell.dataset.date), dir);
        const rightMonth = addMonths(this.state.viewDate, 1).getMonth();
        if (next.getMonth() !== this.state.viewDate.getMonth() && next.getMonth() !== rightMonth) {
          this.state.viewDate = startOfMonth(dir > 0 ? addMonths(this.state.viewDate, 1) : addMonths(this.state.viewDate, -1));
          this._renderNavSelects();
          this._renderCalendars();
        }
        const target = this.$calendars.querySelector('[data-date="' + toISO(next) + '"]');
        if (target) target.focus();
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this._onDayClick(cell.dataset.date);
      }
    }

    _applyPreset(key) {
      const preset = this.presets.find(function (p) { return p.key === key; });
      this.state.activePreset = key;
      if (preset && preset.range) {
        this.state.start = preset.range[0];
        this.state.end = preset.range[1];
        this.state.viewDate = startOfMonth(preset.range[0]);
      }
      this._renderPresets();
      this._renderNavSelects();
      this._renderCalendars();
      this._updateHint();
    }

    _updateHint() {
      if (!this.state.start) this.$hint.textContent = this.L.hintStart;
      else if (!this.state.end) this.$hint.textContent = this.L.hintEnd;
        else this.$hint.textContent = toISO(this.state.start) + ' - ' + toISO(this.state.end);
    }

    _currentLabel() {
      if (this.state.activePreset !== 'custom') return this.L.presets[this.state.activePreset];
      if (this.state.start && this.state.end) return toISO(this.state.start) + ' - ' + toISO(this.state.end);
      return this.L.hintStart;
    }

    _bindLocalEvents() {
      const self = this;
      this.$trigger.addEventListener('click', function () { self._toggle(); });

      this.$presets.addEventListener('click', function (e) {
        const li = e.target.closest('[data-key]');
        if (li) self._applyPreset(li.dataset.key);
      });
      this.$presets.addEventListener('keydown', function (e) {
        if ((e.key === 'Enter' || e.key === ' ') && e.target.dataset.key) {
          e.preventDefault(); self._applyPreset(e.target.dataset.key);
        }
      });

      this.$gran.addEventListener('click', function (e) {
        const li = e.target.closest('[data-gran]');
        if (li) { self.state.granularity = li.dataset.gran; self._renderGranularity(); }
      });

      this.$monthSel.addEventListener('change', function () {
        self.state.viewDate = new Date(self.state.viewDate.getFullYear(), +self.$monthSel.value, 1);
        self._renderCalendars();
      });
      this.$yearSel.addEventListener('change', function () {
        self.state.viewDate = new Date(+self.$yearSel.value, self.state.viewDate.getMonth(), 1);
        self._renderCalendars();
      });

      this.el.querySelector('.drp-arrow-prev').addEventListener('click', function () { self._shiftMonth(-1); });
      this.el.querySelector('.drp-arrow-next').addEventListener('click', function () { self._shiftMonth(1); });

      this.el.querySelector('.drp-btn-cancel').addEventListener('click', function () { self._close(); self.opts.onCancel(); });
      this.el.querySelector('.drp-btn-apply').addEventListener('click', function () { self._apply(); });
    }

    _shiftMonth(n) {
      this.state.viewDate = addMonths(this.state.viewDate, n);
      this._renderNavSelects();
      this._renderCalendars();
    }

    _apply() {
      if (!this.state.start) return;
      const end = this.state.end || this.state.start;
      this.$trigger.querySelector('.drp-trigger-label').textContent = this._currentLabel();
      this._close();
      this.opts.onApply({
        start: toISO(this.state.start),
        end: toISO(end),
        label: this._currentLabel(),
        granularity: this.state.granularity
      });
    }

    _toggle() { if (this.state.open) this._close(); else this._open(); }
    _open() {
      this.state.open = true;
      this.$panel.classList.add('open');
      this.$trigger.setAttribute('aria-expanded', 'true');
      const firstFocusable = this.$presets.querySelector('[data-key]');
      if (firstFocusable) firstFocusable.focus();
    }
    _close() {
      this.state.open = false;
      this.$panel.classList.remove('open');
      this.$trigger.setAttribute('aria-expanded', 'false');
    }

    _bindGlobalEvents() {
      const self = this;
      document.addEventListener('click', function (e) {
        if (self.state.open && !e.composedPath().includes(self.el)) self._close();
      });
      document.addEventListener('keydown', function (e) {
        if (self.state.open && e.key === 'Escape') { self._close(); self.opts.onCancel(); }
      });
    }

    getRange() {
      if (!this.state.start) return null;
      return { start: toISO(this.state.start), end: toISO(this.state.end || this.state.start) };
    }
    destroy() {
      this.el.innerHTML = '';
      this.el.classList.remove('drp-wrap');
    }
  }

  global.DateRangePicker = DateRangePicker;
})(window);
