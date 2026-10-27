// ============================================================
// PEMBUAT PDF SEDERHANA (tanpa library eksternal)
// Menghasilkan dokumen A4 berisi teks & tabel yang rapi.
// ============================================================
(function (global) {
  'use strict';

  var PAGE_W = 595.28;
  var PAGE_H = 841.89;
  var MARGIN = 48;
  var CONTENT_W = PAGE_W - MARGIN * 2;

  var COLORS = {
    primary: [0.008, 0.361, 0.886],   // #025CE2
    dark: [0.059, 0.09, 0.165],       // #0F172A
    gray: [0.392, 0.455, 0.545],      // #64748B
    green: [0.063, 0.725, 0.506],     // #10B981
    amber: [0.961, 0.62, 0.043],      // #F59E0B
    red: [0.937, 0.267, 0.267],       // #EF4444
    line: [0.886, 0.91, 0.941],       // #E2E8F0
    soft: [0.953, 0.961, 0.973],      // #F1F5F9
    white: [1, 1, 1]
  };

  // Bersihkan teks: hanya ASCII agar panjang byte = panjang karakter
  function clean(text) {
    return String(text == null ? '' : text)
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201c\u201d]/g, '"')
      .replace(/[\u2013\u2014]/g, '-')
      .replace(/\u00d7/g, 'x')
      .replace(/\u2264/g, '<=')
      .replace(/\u2265/g, '>=')
      .replace(/\u2192/g, '->')
      .replace(/\u2022/g, '-')
      .replace(/\u2605/g, '*')
      .replace(/\u00b7/g, '-')
      .replace(/[^\x20-\x7E]/g, '');
  }

  function esc(text) {
    return clean(text).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  }

  function measure(text, size, bold) {
    // Perkiraan lebar Helvetica (cukup untuk wrapping & rata kanan)
    return clean(text).length * size * (bold ? 0.55 : 0.5);
  }

  function wrap(text, maxWidth, size, bold) {
    var words = clean(text).split(/\s+/).filter(Boolean);
    var out = [];
    var line = '';
    for (var i = 0; i < words.length; i++) {
      var test = line ? line + ' ' + words[i] : words[i];
      if (measure(test, size, bold) > maxWidth && line) {
        out.push(line);
        line = words[i];
      } else {
        line = test;
      }
    }
    if (line) out.push(line);
    return out.length ? out : [''];
  }

  function num(n) {
    return String(Math.round(n * 1000) / 1000);
  }

  function textCmd(text, x, y, size, bold, color) {
    var c = color || COLORS.dark;
    return 'BT /' + (bold ? 'F2' : 'F1') + ' ' + size + ' Tf ' +
      num(c[0]) + ' ' + num(c[1]) + ' ' + num(c[2]) + ' rg 1 0 0 1 ' +
      num(x) + ' ' + num(y) + ' Tm (' + esc(text) + ') Tj ET';
  }

  function rectCmd(x, y, w, h, color) {
    return num(x) + ' ' + num(y) + ' ' + num(w) + ' ' + num(h) + ' re ' +
      num(color[0]) + ' ' + num(color[1]) + ' ' + num(color[2]) + ' rg f';
  }

  function lineCmd(x1, y1, x2, y2, color) {
    return num(color[0]) + ' ' + num(color[1]) + ' ' + num(color[2]) + ' RG ' +
      num(x1) + ' ' + num(y1) + ' m ' + num(x2) + ' ' + num(y2) + ' l S';
  }

  function PdfReport() {
    this.pages = [[]];
    this.page = 0;
    this.y = PAGE_H - MARGIN;
  }

  PdfReport.prototype._cmds = function () {
    return this.pages[this.page];
  };

  PdfReport.prototype._newPage = function () {
    this.pages.push([]);
    this.page += 1;
    this.y = PAGE_H - MARGIN;
  };

  PdfReport.prototype._ensure = function (height) {
    if (this.y - height < MARGIN + 40) this._newPage();
  };

  PdfReport.prototype.title = function (title, subtitle) {
    this._ensure(70);
    this._cmds().push(rectCmd(MARGIN, this.y - 6, 4, 24, COLORS.primary));
    this._cmds().push(textCmd(title, MARGIN + 12, this.y, 17, true, COLORS.dark));
    this.y -= 24;
    if (subtitle) {
      this._cmds().push(textCmd(subtitle, MARGIN + 12, this.y, 9, false, COLORS.gray));
      this.y -= 18;
    }
    this._cmds().push(lineCmd(MARGIN, this.y, PAGE_W - MARGIN, this.y, COLORS.line));
    this.y -= 14;
    return this;
  };

  PdfReport.prototype.meta = function (text) {
    this._ensure(16);
    this._cmds().push(textCmd(text, MARGIN, this.y, 8.5, false, COLORS.gray));
    this.y -= 12;
    return this;
  };

  PdfReport.prototype.section = function (title) {
    this._ensure(34);
    this.y -= 8;
    this._cmds().push(textCmd(title, MARGIN, this.y, 11, true, COLORS.primary));
    this.y -= 6;
    this._cmds().push(lineCmd(MARGIN, this.y, PAGE_W - MARGIN, this.y, COLORS.line));
    this.y -= 14;
    return this;
  };

  PdfReport.prototype.row = function (label, value, options) {
    options = options || {};
    this._ensure(18);
    var size = 9.5;
    var valueColor = options.color || COLORS.dark;
    this._cmds().push(textCmd(label, MARGIN, this.y, size, false, COLORS.gray));
    var text = clean(value);
    var valueX = PAGE_W - MARGIN - measure(text, size, true);
    this._cmds().push(textCmd(text, valueX, this.y, size, true, valueColor));
    this.y -= 15;
    return this;
  };

  PdfReport.prototype.paragraph = function (text, options) {
    options = options || {};
    var size = options.size || 9.5;
    var color = options.color || COLORS.gray;
    var lines = wrap(text, CONTENT_W, size, false);
    this._ensure(lines.length * 13 + 4);
    for (var i = 0; i < lines.length; i++) {
      this._cmds().push(textCmd(lines[i], MARGIN, this.y, size, false, color));
      this.y -= 13;
    }
    this.y -= 4;
    return this;
  };

  PdfReport.prototype.status = function (text, type) {
    var palette = {
      ok: { bg: [0.933, 0.992, 0.973], bar: COLORS.green, text: [0.024, 0.392, 0.275] },
      warn: { bg: [1, 0.984, 0.925], bar: COLORS.amber, text: [0.553, 0.306, 0.055] },
      bad: { bg: [1, 0.949, 0.949], bar: COLORS.red, text: [0.6, 0.15, 0.17] },
      info: { bg: COLORS.soft, bar: COLORS.primary, text: [0.2, 0.27, 0.35] }
    };
    var p = palette[type] || palette.info;
    var lines = wrap(text, CONTENT_W - 26, 9.5, false);
    var boxH = lines.length * 13 + 18;
    this._ensure(boxH + 10);
    var top = this.y + 10;
    this._cmds().push(rectCmd(MARGIN, top - boxH, CONTENT_W, boxH, p.bg));
    this._cmds().push(rectCmd(MARGIN, top - boxH, 4, boxH, p.bar));
    for (var i = 0; i < lines.length; i++) {
      this._cmds().push(textCmd(lines[i], MARGIN + 12, top - 14 - i * 13, 9.5, false, p.text));
    }
    this.y = top - boxH - 10;
    return this;
  };

  PdfReport.prototype.spacer = function (height) {
    this.y -= (height || 8);
    return this;
  };

  /**
   * Tabel sederhana.
   * widths: fraksi lebar kolom (jumlah = 1)
   * aligns: 'left' | 'right' per kolom
   */
  PdfReport.prototype.table = function (headers, rows, widths, aligns) {
    widths = widths || [];
    aligns = aligns || [];
    var colX = [];
    var acc = MARGIN;
    for (var i = 0; i < widths.length; i++) {
      colX.push(acc);
      acc += widths[i] * CONTENT_W;
    }

    // header
    this._ensure(26);
    this._cmds().push(rectCmd(MARGIN, this.y - 4, CONTENT_W, 18, COLORS.soft));
    for (var h = 0; h < headers.length; h++) {
      var hw = widths[h] * CONTENT_W;
      var hx = colX[h] + 4;
      if (aligns[h] === 'right') hx = colX[h] + hw - 6 - measure(headers[h], 8.5, true);
      this._cmds().push(textCmd(headers[h], hx, this.y + 3, 8.5, true, COLORS.gray));
    }
    this.y -= 20;

    // rows
    for (var r = 0; r < rows.length; r++) {
      var row = rows[r];
      var cellLines = [];
      var maxLines = 1;
      for (var c = 0; c < row.length; c++) {
        var cellWidth = widths[c] * CONTENT_W - 10;
        var lines = wrap(row[c], cellWidth, 9, false);
        cellLines.push(lines);
        if (lines.length > maxLines) maxLines = lines.length;
      }
      var rowH = maxLines * 12 + 6;
      this._ensure(rowH);
      for (var c2 = 0; c2 < row.length; c2++) {
        var w2 = widths[c2] * CONTENT_W;
        for (var li = 0; li < cellLines[c2].length; li++) {
          var lineText = cellLines[c2][li];
          var x2 = colX[c2] + 4;
          if (aligns[c2] === 'right') x2 = colX[c2] + w2 - 6 - measure(lineText, 9, c2 === row.length - 1);
          this._cmds().push(textCmd(lineText, x2, this.y - li * 12, 9, c2 === row.length - 1 && aligns[c2] === 'right', COLORS.dark));
        }
      }
      this.y -= rowH;
      this._cmds().push(lineCmd(MARGIN, this.y + 2, PAGE_W - MARGIN, this.y + 2, COLORS.line));
    }
    this.y -= 4;
    return this;
  };

  PdfReport.prototype.build = function () {
    var total = this.pages.length;
    for (var i = 0; i < total; i++) {
      var cmds = this.pages[i];
      cmds.push(textCmd('LayakDiskon - Asisten Keputusan Diskon UMKM', MARGIN, 30, 8, false, COLORS.gray));
      var pn = 'Halaman ' + (i + 1) + ' dari ' + total;
      cmds.push(textCmd(pn, PAGE_W - MARGIN - measure(pn, 8, false), 30, 8, false, COLORS.gray));
    }

    var objects = [];
    var firstPage = 5;
    var kids = [];
    for (var k = 0; k < total; k++) kids.push((firstPage + k * 2) + ' 0 R');

    objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
    objects[2] = '<< /Type /Pages /Kids [' + kids.join(' ') + '] /Count ' + total + ' >>';
    objects[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
    objects[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';

    for (var p = 0; p < total; p++) {
      var pageObj = firstPage + p * 2;
      var contentObj = pageObj + 1;
      var stream = this.pages[p].join('\n');
      objects[pageObj] = '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + num(PAGE_W) + ' ' + num(PAGE_H) + '] ' +
        '/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ' + contentObj + ' 0 R >>';
      objects[contentObj] = '<< /Length ' + stream.length + ' >>\nstream\n' + stream + '\nendstream';
    }

    var pdf = '%PDF-1.4\n';
    var offsets = [];
    for (var o = 1; o < objects.length; o++) {
      offsets[o] = pdf.length;
      pdf += o + ' 0 obj\n' + objects[o] + '\nendobj\n';
    }
    var xref = pdf.length;
    pdf += 'xref\n0 ' + objects.length + '\n0000000000 65535 f \n';
    for (var x = 1; x < objects.length; x++) {
      pdf += String(offsets[x]).padStart(10, '0') + ' 00000 n \n';
    }
    pdf += 'trailer\n<< /Size ' + objects.length + ' /Root 1 0 R >>\nstartxref\n' + xref + '\n%%EOF';

    return new Blob([pdf], { type: 'application/pdf' });
  };

  function downloadPdf(filename, report) {
    var blob = report.build();
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
  }

  global.PdfReport = PdfReport;
  global.downloadPdf = downloadPdf;
  global.PDF_COLORS = COLORS;
})(window);
