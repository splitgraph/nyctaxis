// Helper to hoist features[].properties.id to features[].id

const fs = require('fs');

let rawdata = fs.readFileSync('taxizones.json');
let taxizones = JSON.parse(rawdata);
console.log(taxizones);

const featuresIdHoisted = taxizones.features.map(f => {
  const { properties: { id }, ...rest } = f;
  const properties = f.properties
  delete properties['id']

  return { id, properties, ...rest}
})

const taxizonesId = {...taxizones, features: featuresIdHoisted }

console.log(taxizonesId)

fs.writeFileSync('taxizones_id.json', JSON.stringify(taxizonesId))