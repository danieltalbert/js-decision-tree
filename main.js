let allRows = [];

Papa.parse("iris.csv", {
  download: true,
  header: true,
  dynamicTyping: true,
  skipEmptyLines: true,
  complete: results => {
    allRows = results.data;
    console.log("Rows:", allRows.length);
    console.log("First flower:", allRows[0]);
    console.log("Columns:", Object.keys(allRows[0]));
      const s = splitRows(allRows, "petal_length", 2.5);
    console.log("left:", s.left.length, "right:", s.right.length);
    console.log("left gini:", gini(s.left), "right gini:", gini(s.right));
    const w = weightedGini(left, right) {
      console.log("left:", gini(s.left), "right gini:", gini(s.right))
    }
  }
});

function gini(rows) {
  const counts = new Map();
  for (const row of rows) {
    counts.set(row.species, (counts.get(row.species) || 0) + 1);
  }
  let impurity = 1;
  for (const count of counts.values()) {
    const p = count / rows.length;
    impurity -= p * p;
  }
  return impurity;
}

// Gini tests: expect 0 and 0.5
const pure = [{species:"setosa"},{species:"setosa"},{species:"setosa"}];
const mixed = [{species:"setosa"},{species:"versicolor"}];
console.log(gini(pure));
console.log(gini(mixed));

function splitRows(rows, feature, threshold) {
  const left = rows.filter(r => r[feature] < threshold);
  const right = rows.filter(r => r[feature] >= threshold);
  return { left, right };
}

function weightedGini(left, right) {
  const total = left.length + right.length;
  return (left.length / total) * gini(left) + (right.length / total) * gini(right);

}