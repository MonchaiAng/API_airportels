"use strict";

const permissions = [
  {
    roleId: 1, // admin
    pages: [
      {
        pageId: 1,
        get: true,
        post: true,
        patch: true,
        delete: true
      },
      {
        pageId: 2,
        get: true,
        post: true,
        patch: true,
        delete: true
      },
      {
        pageId: 3,
        get: true,
        post: true,
        patch: true,
        delete: true
      },
      {
        pageId: 4,
        get: true,
        post: true,
        patch: true,
        delete: true
      },
      {
        pageId: 5,
        get: true,
        post: true,
        patch: true,
        delete: true
      },
      {
        pageId: 6,
        get: true,
        post: true,
        patch: true,
        delete: true
      },
      {
        pageId: 7,
        get: true,
        post: true,
        patch: true,
        delete: true
      },
      {
        pageId: 8,
        get: true,
        post: true,
        patch: true,
        delete: true
      },
      {
        pageId: 9,
        get: true,
        post: true,
        patch: true,
        delete: true
      },
      {
        pageId: 10,
        get: true,
        post: true,
        patch: true,
        delete: true
      },
      {
        pageId: 11,
        get: true,
        post: true,
        patch: true,
        delete: true
      },
      {
        pageId: 12,
        get: true,
        post: true,
        patch: true,
        delete: true
      },
      {
        pageId: 13,
        get: true,
        post: true,
        patch: true,
        delete: true
      }
    ]
  }
];

module.exports = {
  up: (queryInterface, Sequelize) => {
    let page_permissions = [];
    permissions.forEach(permission => {
      permission.pages.forEach(page => {
        page_permissions.push({
          pageId: page.pageId,
          roleId: permission.roleId,
          get: page.get,
          post: page.post,
          patch: page.patch,
          delete: page.delete,
          createdAt: Sequelize.fn("NOW"),
          updatedAt: Sequelize.fn("NOW")
        });
      });
    });
    return queryInterface.bulkInsert("page_permissions", page_permissions);
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete("page_permissions", null, {});
  }
};
