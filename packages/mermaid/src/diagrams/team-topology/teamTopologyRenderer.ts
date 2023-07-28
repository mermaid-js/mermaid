export const draw = (txt, id, _version, diagObj) => {
  const width = 500;
  const height = 500;
  // @ts-ignore: TODO Fix ts errors
  diagObj.db.setHeight(height);
  // @ts-ignore: TODO Fix ts errors
  diagObj.db.setWidth(width);
};

export default {
  draw,
};
