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
            const query = `
            SELECT
            	u.UserTypeId,
            	u.UserId,
            	u.UserName,
            	u.Password,
            	u.BranchId,
            	b.BranchName,
            	u.Name,
            	ut.UserType,
            	u.Autheticate_Id,
            	u.Company_Id AS Company_id,
            	c.Company_Name

            FROM tbl_Users AS u

            LEFT JOIN tbl_Branch_Master AS b
            ON b.BranchId = u.BranchId

            LEFT JOIN tbl_User_Type AS ut
            ON ut.Id = u.UserTypeId

            LEFT JOIN tbl_Company_Master AS c
            ON c.Company_id = u.Company_Id

            WHERE u.Company_Id = @comp AND UDel_Flag= 0`
            const request = new sql.Request(SFDB);
            request.input('User_Id', User_Id);
            request.input('comp', Company_id);
            request.input('Branch_Name', Branch_Id);

            const result = await request.query(query);

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

    const customUserGet = async (req, res) => {
        const { Company_id } = req.query;
        
        if (isNaN(Company_id)) {
            return invalidInput(res, 'Company_id is required');
        }

        try {
            const query = `
            SELECT
            	u.*,
            	b.BranchName,
            	c.Company_id,
            	c.Company_Name
            FROM
            	tbl_Users AS u
            	LEFT JOIN tbl_Branch_Master AS b
            	ON b.BranchId = u.BranchId

            	LEFT JOIN tbl_Company_Master AS c
            	ON c.Company_id = b.Company_id

            WHERE
            	c.Company_id = '${Company_id}'`;
            
            const result = await SFDB.query(query);

            if (result.recordset.length > 0) {
                dataFound(res, result.recordset)
            } else {
                noData(res)
            }
        } catch (e) {
            servError(e, res);
        }
    }

    const salesPersonDropDown = async (req, res) => {
        const { Company_id } = req.query;
        
        if (isNaN(Company_id)) {
            return invalidInput(res, 'Company_id is required');
        }

        try {
            const query = `
            SELECT
                u.UserId,
            	u.Name
            FROM
            	tbl_Users AS u

            	JOIN tbl_Branch_Master AS b
            	ON b.BranchId = u.BranchId

            	JOIN tbl_Company_Master AS c
            	ON c.Company_id = b.Company_id

            WHERE
            	c.Company_id = '${Company_id}'
                AND
                u.UserTypeId = 6`;
            
            const result = await SFDB.query(query);

            if (result.recordset.length > 0) {
                dataFound(res, result.recordset)
            } else {
                noData(res)
            }
        } catch (e) {
            servError(e, res);
        }
    }

    const postUser = async (req, res) => {
        const { Name, UserName, UserTypeId, Password, BranchId, Company_id } = req.body;
        console.log(req.body)

        if (!Name || !UserName || isNaN(UserTypeId) || !Password || isNaN(BranchId) || isNaN(Company_id)) {
            return invalidInput(res, 'Name, UserName, UserTypeId, Password, Company_id and BranchId is required')
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
            request.input('Company_id', Company_id)

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
            request.input('Company_id', 0)


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
            request.input('Company_id', 0)


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
        const { Company_id } = req.query;

        if (isNaN(Company_id)) {
            return invalidInput(res, 'Company_id is required');
        }

        try {
            const result = await SFDB.query(`SELECT UserId, Name FROM tbl_Users WHERE UDel_Flag = 0 AND UserId != 0 AND Company_Id = '${Company_id}'`);

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
        customUserGet,
        getUsers,
        postUser,
        editUser,
        deleteUser,
        userDropDown,
        salesPersonDropDown,
    }
}

export default userMaster()