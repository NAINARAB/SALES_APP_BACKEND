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

            const loginSP = new sql.Request(SFDB);
            loginSP.input('UserName', UserName);
            loginSP.input('Password', decryptedText);

            const result = await loginSP.execute('Qry_GetUser');

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
                    u.*,
                    COALESCE(
                        ut.UserType,
                        'UnKnown UserType'
                    ) AS UserType,
                    COALESCE(
                        b.BranchName,
                        'Unknown Branch'
                    ) AS BranchName,
                    COALESCE(
                        c.Company_id,
                        '0'
                    ) AS Company_id
                FROM 
                    tbl_Users AS u
                LEFT JOIN
                    tbl_User_Type AS ut
                    ON ut.Id = u.UserTypeId
                LEFT JOIN
                    tbl_Branch_Master AS b
                    ON b.BranchId = u.BranchId
                LEFT JOIN
                    tbl_Company_Master AS c
                    ON c.Company_id = b.Company_id

                WHERE
                  Autheticate_Id = @auth`;

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