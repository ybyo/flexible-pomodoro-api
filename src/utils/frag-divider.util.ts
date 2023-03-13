export const timerDivider = (stacks) => {
  const result = [];
  if (stacks[0].data) {
    const data = stacks[0].data;
    data.forEach((e) => {
      result.push({ ...stacks[0], data: e });
    });
  }
  return result;
};
