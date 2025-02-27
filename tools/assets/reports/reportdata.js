class ReportData {
  #header;

  #rows;

  #sortBy;

  constructor(sortBy = null) {
    this.#header = new Set();
    this.#rows = []; // Array of maps
    this.#sortBy = sortBy;
  }

  get size() {
    return this.#rows.length;
  }

  get #rowsArray() {
    const headerArray = Array.from(this.#header);
    const rowsArray = this.#rows.map((row) => headerArray
      .map((field) => (row.has(field) ? row.get(field) : '')));

    // Sorting if a sortBy field is provided
    if (this.#sortBy && headerArray.includes(this.#sortBy)) {
      const sortIndex = headerArray.indexOf(this.#sortBy);
      rowsArray.sort((a, b) => `${a[sortIndex]}`.localeCompare(`${b[sortIndex]}`));
    }

    return rowsArray;
  }

  addRowMap(row) {
    if (!(row instanceof Map)) {
      throw new Error('row must be a Map');
    }
    // Add each key to the header set
    Array.from(row.keys()).forEach((key) => {
      this.#header.add(key);
    });
    this.#rows.push(row); // row should be a Map
  }

  get blob() {
    // Write the CSV column headers using the items from the Set
    const headers = `${Array.from(this.#header).join(',')}\n`;

    // Convert the rows into a single string separated by newlines
    const csv = headers + this.#rowsArray.map((row) => row.map((value) => {
      // Format each value based on its type
      let formattedValue;
      if (Array.isArray(value) || value instanceof Set) {
        // Join arrays or sets into a comma-separated string
        formattedValue = Array.from(value).join(', ');
      } else if (typeof value === 'object' && value !== null) {
        // Convert objects to JSON and strip out newlines
        formattedValue = JSON.stringify(value).replace(/[\r\n]+/g, ' ');
      } else {
        // Convert other types to strings
        formattedValue = String(value);
      }

      // Escape any quotes within the value and wrap it in quotes
      const escape = formattedValue.replace(/"/g, '""');
      return `"${escape}"`; // Wrap value in quotes
    }).join(',')).join('\n');

    // Create a Blob from the CSV string
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    return blob;
  }
}

export default ReportData;
