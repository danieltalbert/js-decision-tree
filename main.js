console.log("Hello")
const nums = [1,2,3,4]
console.log(nums.length)
const flower = {species: "setosa", petal_length: 1.4};
console.log (flower.species)
console.log(flower["species"]);
console.log (5 === "5")
console.log (5 == "5")

function double(n) {return n * 2}

for (const x of nums ) {
    console.log(double(x))
}

Papa.parse("iris.csv", {
  download: true,
  header: true,
  dynamicTyping: true,
  skipEmptyLines: true,
  complete: results => {
    console.log(results.data);
    console.log(results.data.length);
  }
});

const.species = rows.map(r => r.species)