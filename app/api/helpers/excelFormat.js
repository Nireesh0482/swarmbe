/* eslint-disable function-paren-newline */
/* eslint-disable no-confusing-arrow */
/* eslint-disable implicit-arrow-linebreak */
/* eslint-disable no-unused-vars */
/* eslint-disable arrow-body-style */
/* eslint-disable no-param-reassign */
const Excel = require('exceljs');

const excelFormatter = async (reportData) => {
  const sheet = reportData.map(({ id, ...remainingData }) => remainingData);
  const workbook = new Excel.Workbook();
  try {
    const worksheet = workbook.addWorksheet('Audit Report Draft', {
      views: [{ showGridLines: false }],
    });

    // Worksheet Data
    const detailedAuditReport = [[], [' ', 'Audit Checklist']];
    worksheet.addRows(detailedAuditReport);

    const getHeaders = (type) => {
      const filter = sheet.find((e) => e.type === type);
      // delete filter.id;
      return Object.keys(filter);
    };

    const getRows = (type) => {
      const filterData = sheet.filter((e) => e.type === type);
      return filterData;
    };

    const typeArr = [];
    sheet.forEach((data, index) => {
      if (!typeArr.includes(data.type)) {
        typeArr.push(data.type);
        worksheet.addRow([' ']);
        const tableType = worksheet.addRow([' ', data.type]);

        tableType.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          if (colNumber !== 1) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'A9F5CB' },
            };
            cell.font = {
              size: 12,
              bold: true,
            };
            cell.alignment = {
              vertical: 'middle',
              horizontal: 'left',
              wrapText: true,
            };
          }
        });

        // const { id, type, ...restKeys } = data;
        const tableDataKeys = getHeaders(data.type);
        const tableDataKeysUprcase = tableDataKeys.map((header) => {
          return header.replace(/^_*(.)|_+(.)/g, (s, c, d) => (c ? c.toUpperCase() : ` ${d.toUpperCase()}`));
        });

        const tableHeaders = worksheet.addRow([' ', ...tableDataKeysUprcase]);
        tableHeaders.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          if (colNumber !== 1) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'DEEAF6' },
            };
            cell.font = {
              size: 11,
              bold: true,
            };
            cell.alignment = {
              vertical: 'middle',
              horizontal: 'center',
            };
          }
        });

        const rows = getRows(data.type);
        for (const r of rows) {
          const tableDataValues = Object.values(r).map((cellValue) => {
            if (Array.isArray(cellValue)) {
              if (cellValue[0] !== 'null') {
                return cellValue[0];
              }
              return '';
            }

            return cellValue;
          });
          const tableValues = worksheet.addRow([' ', ...tableDataValues]);
          tableValues.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            if (colNumber !== 1) {
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'F5F5F5' },
              };
              cell.alignment = {
                vertical: 'top',
                horizontal: 'left',
                indent: 1,
                wrapText: true,
              };
            }
          });
        }
      }
    });

    // Formatting of Sheets

    // Setting row height for worksheets
    worksheet.getRow(2).height = 21;
    worksheet.properties.defaultColWidth = 20;

    // Setting Column width for worksheet1
    worksheet.getColumn(1).width = 8.43;
    worksheet.getColumn(2).width = 22;

    // const totalColCount = worksheet.columnCount;

    // worksheet2.mergeCells("B2: B`${totalColCount}`");
    worksheet.mergeCells('B2:R2');

    // Hide specific cols
    // const idCol = worksheet2.getColumn("id");
    // idCol.hidden = true;

    // const typeCol = worksheet2.getColumn("type");
    // typeCol.hidden = true;

    // Fill Color-Sheet2

    // Checklist title Formatting
    worksheet.getCell('B2').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'A9F5CB' },
    };

    worksheet.getCell('B2').font = {
      name: 'Calibri',
      size: 13,
      bold: true,
    };

    worksheet.getCell('B2').alignment = {
      vertical: 'middle',
      horizontal: 'center',
      indent: 1,
    };

    worksheet.getCell('B2').border = {
      top: { style: 'thick' },
      left: { style: 'thick' },
      bottom: { style: 'thick' },
      right: { style: 'thick' },
    };

    // Border For Worksheet2
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        if (colNumber !== 1) {
          // Set border of each cell
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          };
        }
      });
      // Commit the changed row to the stream
      row.commit();
    });

    // creating worksheet in workbook
    await workbook.xlsx.writeFile('app/static/Excel/auditDraft.xlsx');
    return true;
  } catch (error) {
    if (error) {
      return undefined;
    }
  }
};

module.exports = {
  excelFormatter,
};
