import SFDB from '../dbConfig/connectionPool.mjs';
import sql from 'mssql';
import { dataFound, falied, invalidInput, noData, servError, success } from '../sfResFun.mjs'

const GeneralApi = () => {

    const getSidebarForUser = async (req, res) => {
        const { Auth } = req.query;

        if (!Auth) {
            return invalidInput(res, 'Auth is required');
        }

        try {
            const request = new sql.Request(SFDB);
            request.input('Autheticate_Id', Auth);
            const result = await request.execute('User_Rights_Side');

            return dataFound(res, result.recordsets);
        } catch (e) {
            servError(e, res);
        }
    }

    return {
        getSidebarForUser,
    }
}

export default GeneralApi()