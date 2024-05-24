import sql from 'mssql';
import SFDB from '../../dbConfig/connectionPool.mjs';
import { invalidInput, servError, dataFound, noData, falied, success } from '../../sfResFun.mjs';

const companyController = () => {

    const getCompanyInfo = async (req, res) => {
        const { Company_id } = req.query;

        if (isNaN(Company_id)) {
            return invalidInput(res, 'Company_id is required');
        }

        try {
            const query = `SELECT * FROM tbl_Company_Master WHERE Company_id = @comp`;

            const request = new sql.Request(SFDB);
            request.input('comp', Company_id);

            const result = await request.query(query);

            if (result.recordset.length > 0) {
                dataFound(res, result.recordset);
            } else {
                noData(res)
            }
        } catch (e) {
            servError(e, res);
        }
    }

    return {
        getCompanyInfo,
    }
}

export default companyController();