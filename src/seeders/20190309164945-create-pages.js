"use strict";
const pages = [
  {
    name: "Login",
    route: "/login"
  },
  {
    name: "Logout",
    route: "/logout"
  },
  {
    name: "Master route plan",
    route: "/mrp"
  },
  {
    name: "Driver",
    route: "/driver"
  },
  {
    name: "Register Driver",
    route: "/registerdriver"
  },
  {
    name: "Users",
    route: "/user"
  },
  {
    name: "Setting Payment",
    route: "/setting/payment"
  },
  {
    name: "Notification",
    route: "/notification"
  },
  {
    name: "Report Daily",
    route: "/report/daily"
  },
  {
    name: "Report Statistic",
    route: "/report/statistic"
  },
  {
    name: "Report Accounting",
    route: "/report/accounting"
  },
  {
    name: "Report Payment Voucher",
    route: "/report/paymentVoucher"
  },
  {
    name: "FAQ",
    route: "/faq"
  }
];

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert(
      "pages",
      pages.map((page, index) => ({
        id: index + 1,
        name: page.name,
        route: page.route,
        createdAt: Sequelize.fn("NOW"),
        updatedAt: Sequelize.fn("NOW")
      }))
    );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete("pages", null, {});
  }
};
