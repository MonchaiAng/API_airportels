const buildParams = (data) => {
  const params = new URLSearchParams();
  Object.keys(data).forEach(key => params.append(key, data[key]));
  return `?${params.toString()}`;
};

const getTokenFromRequest = req => req.headers.authorization.split(' ')[1];

module.exports = {
  buildParams,
  getTokenFromRequest,
};
