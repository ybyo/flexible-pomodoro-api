export const entityFormatter = <T>(
  arr: T[],
  prefix: string,
  newProperty?: object,
) => {
  let result = [];
  const ids = [];
  const k = Object.keys(newProperty)[0];
  const v = Object.values(newProperty)[0];
  result = arr.map((item) => {
    const newItem = {};
    Object.keys(item).forEach((key) => {
      let newKey = key;
      if (!key.startsWith(prefix)) {
        newItem[key] = item[key];
      } else {
        newKey = key.substring(1);
        newItem[newKey] = item[key];
      }
      if (key === '_id') {
        ids.push(newItem[newKey]);
      }
    });
    newItem[k] = v;
    return newItem;
  });
  return { result, ids };
};
