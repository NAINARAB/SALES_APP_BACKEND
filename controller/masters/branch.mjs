import sql from 'mssql';
import SFDB from '../../dbConfig/connectionPool.mjs';
import { invalidInput, servError, dataFound, noData, falied, success } from '../../sfResFun.mjs';

const branchController = () => {

    const getBranchDrowDown = async (req, res) => {
        const { User_Id, Company_id } = req.query;

        // if (isNaN(User_Id) || isNaN(Company_id)) {
        //     return invalidInput(res, 'User_Id, Company_id are required')
        // }

        try {
            const request = new sql.Request(SFDB);
            // request.input('User_Id', User_Id);
            // request.input('Company_id', Company_id);
            request.input('User_Id', 1);
            request.input('Company_id', 1);
            const result = await request.execute('Branch_List');

            if (result.recordset.length > 0) {
                dataFound(res, result.recordset)
            } else {
                noData(res)
            }
        } catch (e) {
            servError(e, res)
        }
    }

    const getBranch = async (req, res) => {
        const { User_Id, Company_id } = req.query;

        if (!User_Id || !Company_id) {
            return invalidInput(res, 'User_Id, Company_id are required')
        }

        try {
            const request = new sql.Request(SFDB);
            request.input('User_Id', User_Id);
            request.input('Company_id', Company_id);
            request.input('Branch_Name', "");
            const result = await request.execute('BranchMaster_vw');

            if (result.recordset.length > 0) {
                dataFound(res, result.recordset)
            } else {
                noData(res)
            }
        } catch (e) {
            servError(e, res)
        }
    };

    const postBranch = async (req, res) => {
        const { Company_id, BranchCode, BranchName, Tele_Code, BranchTel1, Tele1_Code, BranchTel,
            BranchAddress, E_Mail, BranchIncharge, BranchIncMobile, BranchCity, Pin_Code, State, BranchCountry, Entry_By } = req.body;

        if (!BranchName || !Company_id || !BranchCity || !State || !BranchCountry || !BranchCode  || !Entry_By) {
            return invalidInput(res, 'Company_id, BranchName, BranchCity, State, BranchCountry, BranchCode, Entry_By is required')
        }

        try {
            const request = new sql.Request(SFDB);
            request.input('Mode', 1);
            request.input('BranchId', 0);
            request.input('Company_id', Company_id);
            request.input('BranchCode', BranchCode);
            request.input('BranchName', BranchName);
            request.input('Tele_Code', Tele_Code);
            request.input('BranchTel1', BranchTel1);
            request.input('Tele1_Code', Tele1_Code);
            request.input('BranchTel', BranchTel);
            request.input('BranchAddress', BranchAddress);
            request.input('E_Mail', E_Mail);
            request.input('BranchIncharge', BranchIncharge);
            request.input('BranchIncMobile', BranchIncMobile);
            request.input('BranchCity', BranchCity);
            request.input('Pin_Code', Pin_Code);
            request.input('State', State);
            request.input('BranchCountry', BranchCountry);
            request.input('Entry_By', Entry_By);

            const result = await request.execute('Branch_Master_SP');

            if (result.rowsAffected[0] > 0) {
                success(res, 'Branch created successfully')
            } else {
                falied(res, 'Failed to create branch')
            }
        } catch (e) {
            servError(e, res)
        }
    }

    const putBranch = async (req, res) => {
        const { BranchId, Company_id, BranchCode, BranchName, Tele_Code, BranchTel1, Tele1_Code, BranchTel,
            BranchAddress, E_Mail, BranchIncharge, BranchIncMobile, BranchCity, Pin_Code, State, BranchCountry, Entry_By } = req.body;

        if (!BranchId || !BranchName || !Company_id || !BranchCity || !State || !BranchCountry || !BranchCode  || !Entry_By) {
            return invalidInput(res, 'Company_id, BranchName, BranchCity, State, BranchCountry, BranchCode, Entry_By is required')
        }

        try {
            const request = new sql.Request(SFDB);
            request.input('Mode', 2);
            request.input('BranchId', BranchId);
            request.input('Company_id', Company_id);
            request.input('BranchCode', BranchCode);
            request.input('BranchName', BranchName);
            request.input('Tele_Code', Tele_Code);
            request.input('BranchTel1', BranchTel1);
            request.input('Tele1_Code', Tele1_Code);
            request.input('BranchTel', BranchTel);
            request.input('BranchAddress', BranchAddress);
            request.input('E_Mail', E_Mail);
            request.input('BranchIncharge', BranchIncharge);
            request.input('BranchIncMobile', BranchIncMobile);
            request.input('BranchCity', BranchCity);
            request.input('Pin_Code', Pin_Code);
            request.input('State', State);
            request.input('BranchCountry', BranchCountry);
            request.input('Entry_By', Entry_By);

            const result = await request.execute('Branch_Master_SP');

            if (result.rowsAffected[0] > 0) {
                success(res, 'Changes Saved')
            } else {
                falied(res, 'Failed to Save changes')
            }
        } catch (e) {
            servError(e, res)
        }
    }

    const deleteBranch = async (req, res) => {
        const { BranchID } = req.body;

        if (!BranchID) {
            return invalidInput(res, 'BranchID is required')
        }

        try {
            const request = new sql.Request(SFDB);
            request.input('Mode', 3);
            request.input('BranchId', BranchID);
            request.input('Company_id', 0);
            request.input('BranchCode', 0);
            request.input('BranchName', 0);
            request.input('Tele_Code', 0);
            request.input('BranchTel1', 0);
            request.input('Tele1_Code', 0);
            request.input('BranchTel', 0);
            request.input('BranchAddress', 0);
            request.input('E_Mail', 0);
            request.input('BranchIncharge', 0);
            request.input('BranchIncMobile', 0);
            request.input('BranchCity', 0);
            request.input('Pin_Code', 0);
            request.input('State', 0);
            request.input('BranchCountry', 0);
            request.input('Entry_By', 0);

            const result = await request.execute('Branch_Master_SP');

            if (result.rowsAffected[0] > 0) {
                success(res, 'Branch Deleted')
            } else {
                falied(res, 'Failed to delete branch')
            }
        } catch (e) {
            servError(e, res)
        }
    }

    return {
        getBranchDrowDown,
        getBranch,
        postBranch,
        putBranch,
        deleteBranch,
    }
}

export default branchController();