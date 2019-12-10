const parse = (stringToParse) => {

  let s1 = "\\n";
  let s2 = "\\";
  let s3 = "answer: ";
  let t1 = '"{'
  let t2 = "{"
  let t3 = '}"'
  let t4 = "}"

  var newStr = stringToParse.split(s1).join("").split(s2).join("")
    .replace(s3,"").replace(t1,t2).replace(t3,t4);

  return JSON.parse(newStr);
};

exports.parse = parse;
