function parseCSV(csvData, selectedFields) {
  // Split the CSV data into an array of rows
  const rows = csvData.trim().split('\n');

  // Split the first row (which contains the field names) into an array of field names
  const fields = rows[0].split(',');

  // Determine which columns to keep based on the selected fields
  const keepColumns = [];
  for (let i = 0; i < fields.length; i++) {
    if (selectedFields.includes(fields[i])) {
      keepColumns.push(i);
    }
  }

  // Loop over the rows and keep only the selected columns
  const result = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i].split(',');
    const newRow = [];
    for (let j = 0; j < keepColumns.length; j++) {
      newRow.push(row[keepColumns[j]]);
    }
    result.push(newRow);
  }

  return result;
}

export { parseCSV };