import SFDB from '../../dbConfig/connectionPool.mjs';
import sql from 'mssql';
import { dataFound, falied, invalidInput, noData, servError, success } from '../../sfResFun.mjs';
import CryptoJS from 'crypto-js';

const LoginControl = () => {

    const getLogin = async (req, res) => {
        const { UserName, Password } = req.body;
        if (!UserName || !Password) {
            return invalidInput(res, 'UserName and Password is required');
        }

        try {
            const decrypt = CryptoJS.AES.decrypt(Password, 'ly4@&gr$vnh905RyB>?%#@-(KSMT');
            const decryptedText = decrypt.toString(CryptoJS.enc.Utf8);

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

            WHERE UserName = @UserName AND Password = @Password AND UDel_Flag= 0`;

            const loginSP = new sql.Request(SFDB);
            loginSP.input('UserName', String(UserName).trim());
            loginSP.input('Password', decryptedText);

            const result = await loginSP.query(query);

            if (result.recordset.length > 0) {
                dataFound(res, result.recordset, 'Login Successfully')
            } else {
                falied(res, 'Invalid UserName or Password');
            }
        } catch (e) {
            servError(e, res);
        }
    }

    const getLoginBYAuth = async (req, res) => {
        const { Auth } = req.query;

        if (!Auth) {
            return invalidInput(res, 'Auth required');
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

            WHERE u.Autheticate_Id = @auth AND UDel_Flag= 0`;

            const request = new sql.Request(SFDB);
            request.input('auth', Auth)

            const result = await request.query(query);

            if (result.recordset.length > 0) {
                return dataFound(res, result.recordset)
            } else {
                return falied(res, 'User Not Found')
            }
        } catch (e) {
            servError(e, res);
        }
    }


    return {
        getLogin,
        getLoginBYAuth
    }
}

export default LoginControl()