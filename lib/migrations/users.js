module.exports = {
    up: (queryInterface, Sequelize) => queryInterface.createTable('users', {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.INTETER
        },
        roleId: {
            allowNull: false,
            type: Sequelize.INTETER,
            references: { model: 'roles', key: 'id'}
        },
        firstName: {
            allowNull: false,
            type: Sequelize.STRING(50)
        },
        lastName: {
            allowNull: false,
            type: Sequelize.STRING(50)
        },
        imagePath: {
            type: Sequelize.STRING(200)
        },
        password: {
            allowNull: false,
            type: Sequelize.STRING(100)
        },
        email: {
            allowNull: false,
            type: Sequelize.STRING(100)
        },
        createdAt: {
            allowNull: false,
            type: Sequelize.DATE
        },
        createdBy: {
            allowNull: false,
            type: Sequelize.INTETER
        },
        updatedAt: {
            type: Sequelize.DATE
        },
        updatedBy: {
            type: Sequelize.INTETER
        },
        status: {
            allowNull: false,
            type: Sequelize.BOOLEAN
        }
        .then( () => queryInterface.addIndex('users', {fields: ['roleId'], name: 'users_roleId'}))
    }),
    down: (queryInterface) => queryInterface.dropTable('users')
};