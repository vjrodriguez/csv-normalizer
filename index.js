const fs = require('fs').promises;
const parse = require('csv-parse/lib/sync');
const argv = require('yargs').argv;
const moment = require('moment-timezone');
const ObjectsToCsv = require('objects-to-csv');
const emojiRegex = require('emoji-regex/RGI_Emoji.js');

//grabs this from the command line command i.e. node ./ input.json output.csv
const inputFileName = argv._[0];
const outputFileName = argv._[1];
//console.log(args from terminal,argv._[0],argv._[1]);

(async function() {
  // const fileContent = await fs.readFile(__dirname + '/sample.csv');
  const fileContent = await fs.readFile(__dirname + `/${inputFileName}`);
  const records = parse(fileContent, {
    columns: true
  });

  //records is the parsed version of tthe input csv file, its data ype is an array of objects
  for(let data of records){
    data["Timestamp"] = convertToEastern(new Date(data["Timestamp"]))
    data["Address"] = replaceNonUTF8(data["Address"])
    data["ZIP"] = normalizeZip(data["ZIP"])
    data["FullName"] = uppercasifyName(data["FullName"])
    data["FooDuration"] = totalSeconds(data["FooDuration"])
    data["BarDuration"] = totalSeconds(data["BarDuration"])
    data["TotalDuration"] = getTotalDuration(data["FooDuration"], data["BarDuration"])
    data["Notes"] = replaceNonUTF8(data["Notes"])
  }
  console.log("Records in an array: ",records);

  //convert it back to a csv after data has been normalized 
  const csv = new ObjectsToCsv(records);
  //await csv.toDisk(`./output.csv`);
  await csv.toDisk(`./${outputFileName}`);
  console.log("Successfully normalized up CSV!");
})();

//check string for utf8 and emoji, replace with Replacement Character if fails check
function replaceNonUTF8(str){
  let cleanString = ""
  const regex = emojiRegex();
  for(let i = 0; i < str.length; i++){
    if(regex.exec(str) || str.charCodeAt(i) <= 127){
      cleanString += str[i]
    }else if(regex.exec(str)){
      cleanString += str[i]
    }else {
      cleanString += "�"
    }
  }
  return cleanString
}

//convert time to eastern time zone
function convertToEastern(time){
  const eastern = moment(time).add(3, 'hours')
  return eastern.tz("America/New_York").format()
}

//add zeros as prefix when zipcode length is less than 5
function normalizeZip(zipString){
  if(zipString.length === 5) return zipString
  let newZip = ''
  let prefix = ''
  if(zipString.length < 5){
    let difference = 5 - zipString.length
    for(let i = 0; i < difference; i++){
      prefix += '0'
    }
    newZip = `${prefix}${zipString}`
  }
  return newZip
}

//uppercase a string and runs it thru utf8 check
function uppercasifyName(name) {
  return replaceNonUTF8(name.toUpperCase())
}

//convert duration into seconds
function totalSeconds(time) {
  time = time.split(":")
  const hourToSec = time[0] * 3600
  const minToSec = time[1] * 60
  const sec = time[2].slice(0,2) * 1 //times one to coerce into numeric value
  const msToSec = time[2].slice(3) * 0.001
  const totalInSeconds = hourToSec + minToSec + sec + msToSec
  return `${totalInSeconds}`
}

//add sum of two durations
function getTotalDuration (durationOne, durationTwo) {
  let sum = Number(durationOne) + Number(durationTwo)
  return `${sum}`
}
