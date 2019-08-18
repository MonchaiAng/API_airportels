const { DriverBankings } = require('../models');

const storeDriverBankings = async (
  driverId,
  bankId,
  accountNo,
  accountName,
  cutOffPeriod,
  updatedBy,
) => {
  const driverBanking = await DriverBankings.findOne({
    where: {
      isActive: 1,
    },
  });
  if (!driverBanking) {
    await DriverBankings.create({
      driverId,
      bankId,
      accountNo,
      accountName,
      cutOffPeriod,
      isActive: 1,
      createdBy: updatedBy,
      updatedBy,
    });
  } else if (
      driverBanking.accountNo === accountNo
      && driverBanking.bankId === bankId
    ) {
      await driverBanking.update({
        accountName,
        cutOffPeriod,
        isActive: 1,
        updatedBy
      });
    } else {
      await driverBanking.update({
        isActive: 0,
        updatedBy
      });
      await DriverBankings.create({
        driverId,
        bankId,
        accountNo,
        accountName,
        cutOffPeriod,
        isActive: 1,
        createdBy: updatedBy,
        updatedBy
      });
    }
};

module.exports = {
  storeDriverBankings,
};
