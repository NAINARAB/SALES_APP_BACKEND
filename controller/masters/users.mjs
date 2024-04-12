import sql from 'mssql'
import SFDB from '../../dbConfig/connectionPool.mjs'
import { invalidInput, servError, dataFound, noData, falied, success } from '../../sfResFun.mjs';
import CryptoJS from 'crypto-js';

const userMaster = () => {

    const getUsers = async (req, res) => {
        const { User_Id, Company_id, Branch_Id } = req.query;

        if (isNaN(User_Id) || isNaN(Company_id) || isNaN(Branch_Id)) {
            return invalidInput(res, 'User_Id, Company_id, Branch_Id is Required')
        }

        try {
            const request = new sql.Request(SFDB);
            request.input('User_Id', User_Id);
            request.input('Company_id', Company_id);
            request.input('Branch_Name', Branch_Id);

            const result = await request.execute('Users_vw');

            if (result.recordset.length > 0) {
                const encryptPassword = result.recordset.map(o => ({...o, Password: CryptoJS.AES.encrypt(o.Password, 'ly4@&gr$vnh905RyB>?%#@-(KSMT').toString()}))
                const sorted = encryptPassword.sort((a, b) => a.Name.localeCompare(b.Name));
                dataFound(res, sorted)
            } else {
                noData(res)
            }
        } catch (e) {
            servError(e, res)
        }
    };

    const postUser = async (req, res) => {
        const { Name, UserName, UserTypeId, Password, BranchId } = req.body;

        if (!Name || !UserName || !UserTypeId || !Password || !BranchId) {
            return invalidInput(res, 'Name, UserName, UserTypeId, Password and BranchId is required')
        }

        try {

            const checkTable = await SFDB.query(`SELECT UserId FROM tbl_Users WHERE UserName = '${UserName}'`)
            if (checkTable.recordset.length > 0) {
                return falied(res, 'Mobile Number is already exist')
            }

            const decrypt = CryptoJS.AES.decrypt(Password, 'ly4@&gr$vnh905RyB>?%#@-(KSMT');
            const decryptedText = decrypt.toString(CryptoJS.enc.Utf8);

            const request = new sql.Request(SFDB);
            request.input('Mode', 1);
            request.input('UserId', 0);
            request.input('Name', Name);
            request.input('UserName', UserName);
            request.input('UserTypeId', UserTypeId);
            request.input('Password', decryptedText);
            request.input('BranchId', BranchId);

            const result = await request.execute('UsersSP');

            if (result.rowsAffected[0] > 0) {
                success(res, 'User created')
            } else {
                falied(res, 'Failed to create')
            }

        } catch (e) {
            servError(e, res)
        }
    }

    const editUser = async (req, res) => {
        const { UserId, Name, UserName, UserTypeId, Password, BranchId } = req.body;

        if (!UserId || !Name || !UserName || !UserTypeId || !Password || !BranchId) {
            return invalidInput(res, 'UserId, Name, UserName, UserTypeId, Password and BranchId is required')
        }

        try {

            const checkTable = await SFDB.query(`SELECT UserId FROM tbl_Users WHERE UserName = '${UserName}' AND UserId != '${UserId}'`)
            if (checkTable.recordset.length > 0) {
                return falied(res, 'Mobile Number is already exist')
            }

            const decrypt = CryptoJS.AES.decrypt(Password, 'ly4@&gr$vnh905RyB>?%#@-(KSMT');
            const decryptedText = decrypt.toString(CryptoJS.enc.Utf8);
            
            const request = new sql.Request(SFDB);
            request.input('Mode', 2);
            request.input('UserId', UserId);
            request.input('Name', Name);
            request.input('UserName', UserName);
            request.input('UserTypeId', UserTypeId);
            request.input('Password', decryptedText);
            request.input('BranchId', BranchId);

            const result = await request.execute('UsersSP');

            if (result.rowsAffected[0] > 0) {
                success(res, 'Changes Saved!')
            } else {
                falied(res, 'Failed to save changes')
            }

        } catch (e) {
            servError(e, res)
        }
    }

    const deleteUser = async (req, res) => {
        const { UserId } = req.body;

        if (!UserId) {
            return invalidInput(res, 'UserId is required')
        }

        try {
            const request = new sql.Request(SFDB);
            request.input('Mode', 3);
            request.input('UserId', UserId);
            request.input('Name', 0);
            request.input('UserName', 0);
            request.input('UserTypeId', 0);
            request.input('Password', 0);
            request.input('BranchId', 0);

            const result = await request.execute('UsersSP');

            if (result.rowsAffected[0] > 0) {
                success(res, 'User deleted')
            } else {
                falied(res, 'Failed to delete')
            }

        } catch (e) {
            servError(e, res)
        }
    }

    const userDropDown = async (req, res) => {

        try {
            const result = await SFDB.query('SELECT UserId, Name FROM tbl_Users WHERE UDel_Flag = 0 AND UserId != 0');

            if (result.recordset.length > 0) {
                result.recordset.map(o => {
                    o.UserId = parseInt(o.UserId)
                })
                dataFound(res, result.recordset);
            } else {
                noData(res, 'No Users Found');
            }
        } catch (e) {
            servError(e, res)
        }
    }

    return {
        getUsers,
        postUser,
        editUser,
        deleteUser,
        userDropDown,
    }
}

export default userMaster()