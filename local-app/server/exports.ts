import ExcelJS from 'exceljs'
import type { ReportName, ReportRow } from './database.js'

const definitions = {
  'missed-checkout': {
    title: 'Missed Check-Out Report',
    worksheet: 'Missed Check-Out',
    filename: 'Missed_Checkout_Report',
    columns: [
      ['room', 'Room Number'],
      ['arrival', 'Arrival Date'],
      ['departure', 'Departure Date'],
      ['confirmation', 'Confirmation ID'],
      ['profile', 'Profile ID'],
    ],
  },
  'yesterdays-comments': {
    title: "Yesterday's Comments Report",
    worksheet: 'Yesterday Comments',
    filename: 'Yesterdays_Comments_Report',
    columns: [
      ['room', 'Room No'],
      ['confirmation', 'Conf No'],
      ['type', 'Comment Type'],
      ['comment', 'Comment'],
      ['commentDate', 'Comment Date'],
      ['submitted', 'Comment Submitted Date'],
      ['commentBy', 'Comment By'],
      ['gsa', 'GSA'],
      ['updatedBy', 'Comment Updated By'],
      ['updated', 'Comment Update Date'],
      ['arrival', 'Arrival Date'],
      ['departure', 'Departure Date'],
    ],
  },
} satisfies Record<ReportName, {
  title: string
  worksheet: string
  filename: string
  columns: Array<[string, string]>
}>

function formulaSafe(value: string | null): string {
  if (!value) return ''
  return /^[=+\-@]/.test(value) ? `'${value}` : value
}

function csvCell(value: string): string {
  return `"${value.replaceAll('"', '""')}"`
}

export function createCsv(name: ReportName, rows: ReportRow[]): { buffer: Buffer; filename: string } {
  const definition = definitions[name]
  const lines = [
    definition.columns.map(([, label]) => csvCell(label)).join(','),
    ...rows.map((row) => definition.columns.map(([key]) => csvCell(formulaSafe(row[key] ?? null))).join(',')),
  ]
  return {
    buffer: Buffer.from(`\uFEFF${lines.join('\r\n')}`, 'utf8'),
    filename: `${definition.filename}_${new Date().toISOString().slice(0, 10)}.csv`,
  }
}

export async function createExcel(name: ReportName, rows: ReportRow[]): Promise<{ buffer: Buffer; filename: string }> {
  const definition = definitions[name]
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Operations Report'
  workbook.created = new Date()
  const sheet = workbook.addWorksheet(definition.worksheet, {
    views: [{ state: 'frozen', ySplit: 5 }],
  })
  sheet.addRow([definition.title])
  sheet.addRow([`Generated: ${new Date().toLocaleString()}`])
  sheet.addRow([`Rows: ${rows.length}`])
  sheet.addRow([])
  sheet.addRow(definition.columns.map(([, label]) => label))
  sheet.getRow(1).font = { bold: true, size: 16, color: { argb: 'FF0F172A' } }
  sheet.getRow(3).font = { bold: true, color: { argb: 'FF0F766E' } }
  sheet.getRow(5).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F3B4C' } }
    cell.alignment = { vertical: 'middle' }
  })
  if (rows.length === 0) {
    sheet.addRow(['No records returned'])
  } else {
    rows.forEach((row, index) => {
      const excelRow = sheet.addRow(definition.columns.map(([key]) => formulaSafe(row[key] ?? null)))
      if (index % 2 === 1) {
        excelRow.eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } }
        })
      }
      if (name === 'yesterdays-comments') {
        excelRow.getCell(4).alignment = { vertical: 'top', wrapText: true }
        excelRow.height = 36
      }
    })
  }
  sheet.autoFilter = { from: { row: 5, column: 1 }, to: { row: 5, column: definition.columns.length } }
  definition.columns.forEach(([key, label], index) => {
    sheet.getColumn(index + 1).width = key === 'comment' ? 60 : Math.max(15, label.length + 3)
  })
  const output = await workbook.xlsx.writeBuffer()
  return {
    buffer: Buffer.from(output),
    filename: `${definition.filename}_${new Date().toISOString().slice(0, 10)}.xlsx`,
  }
}
