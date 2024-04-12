import sql from 'mssql'
import SFDB from '../../dbConfig/connectionPool.mjs';
import { dataFound, falied, invalidInput, noData, servError, success } from '../../sfResFun.mjs';


const userTypeMaster = () => {

    const getUserType = async (req, res) => {
        const getQuery = `SELECT * FROM tbl_User_Type WHERE IsActive = 1`
        try {
            const userType = await SFDB.query(getQuery);
            if (userType.recordset.length) {
                dataFound(res, userType.recordset)
            } else {
                noData(res)
            }
        } catch (e) {
            servError(e, res)
        }
    }

    const postUserType = async (req, res) => {
        const { UserType } = req.body;
        try {
            const request = new sql.Request();
            request.input('Mode', 1);
            request.input('Id', 0);
            request.input('UserType', UserType);
            const result = await request.execute('User_Type_SP');

            if (result.rowsAffected[0] > 0) {
                success(res, 'User Type Created')
            } else {
                falied(res, 'Failed to create')
            }

        } catch (err) {
            servError(e, res)
        }
    }

    const editUserType = async (req, res) => {
        const { Id, UserType } = req.body;

        if (!Id || !UserType) {
            return invalidInput(res, 'Id, UserType is required')
        }
        try {
            const request = new sql.Request();
            request.input('Mode', 2);
            request.input('Id', Id);
            request.input('UserType', UserType);
            const result = await request.execute('User_Type_SP');

            if (result.rowsAffected[0] > 0) {
                success(res, 'Changes Saved')
            } else {
                falied(res, 'Failed to Save!')
            }

        } catch (err) {
            servError(e, res)
        }
    }

    const deleteUserType = async (req, res) => {
        const { Id } = req.body;

        if (!Id) {
            invalidInput(res, 'Id is required')
        }

        try {
            const request = new sql.Request();
            request.input('Mode', 3);
            request.input('Id', Id);
            request.input('UserType', 0);
            const result = await request.execute('User_Type_SP');

            if (result.rowsAffected[0] > 0) {
                success(res, 'User Type Deleted')
            } else {
                falied(res, 'Failed to Delete')
            }

        } catch (err) {
            servError(e, res)
        }
    }

    return {
        getUserType,
        postUserType,
        editUserType,
        deleteUserType
    }
}

export default userTypeMaster()