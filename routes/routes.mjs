import express from "express";
import RetailerControll from "../controller/sfRetailers.mjs";
import sfProductController from "../controller/sfProducts.mjs";
import sfDistributors from "../controller/sfDistributors.mjs";
import sfRoutes from "../controller/sfRoutes.mjs";
import sfMasters from "../controller/sfMasters.mjs";
import LoginControl from "../controller/login.mjs";
import userType from "../controller/masters/userType.mjs";
import userMaster from "../controller/masters/users.mjs";
import branchController from '../controller/masters/branch.mjs';
import generalConfig from "../controller/generalConfig.mjs";
import attendance from "../controller/general/attendance.mjs";
import closingStock from "../controller/sales/closingStock.mjs";

const SfRouter = express.Router();

//Login 
SfRouter.post('/api/login', LoginControl.getLogin)
SfRouter.post('/api/userAuth', LoginControl.getLoginBYAuth)

//Sidebar
SfRouter.get('/api/sidebar', generalConfig.getSidebarForUser)

//sfMasters
SfRouter.get('/api/masters/state', sfMasters.getStates);

SfRouter.get('/api/masters/district', sfMasters.getDistricts);

SfRouter.get('/api/masters/areas', sfMasters.getAreas);

SfRouter.get('/api/masters/outlets', sfMasters.getOutlet);


//Branch
SfRouter.get('/api/masters/branch', branchController.getBranch)
SfRouter.post('/api/masters/branch', branchController.postBranch)
SfRouter.put('/api/masters/branch', branchController.putBranch)
SfRouter.delete('/api/masters/branch', branchController.deleteBranch)
SfRouter.get('/api/masters/branch/dropDown', branchController.getBranchDrowDown)



//UserType 
SfRouter.get('/api/masters/userType', userType.getUserType);
SfRouter.post('/api/masters/userType', userType.postUserType);
SfRouter.put('/api/masters/userType', userType.editUserType);
SfRouter.delete('/api/masters/userType', userType.deleteUserType);


//users
SfRouter.get('/api/masters/users', userMaster.getUsers);
SfRouter.post('/api/masters/users', userMaster.postUser);
SfRouter.put('/api/masters/users', userMaster.editUser);
SfRouter.delete('/api/masters/users', userMaster.deleteUser);
SfRouter.get('/api/masters/users/dropDown', userMaster.userDropDown);
SfRouter.get('/api/masters/custom-users', userMaster.customUserGet)




// retailersApi
SfRouter.get('/api/masters/retailers', RetailerControll.getSFCustomers);
SfRouter.get('/api/masters/retailers/dropDown', RetailerControll.getSFCustomers);
SfRouter.get('/api/masters/retailers/areaRetailers', RetailerControll.getAreaRetailers)
SfRouter.post('/api/masters/retailers', RetailerControll.addRetailers);
SfRouter.put('/api/masters/retailers', RetailerControll.putRetailers);
SfRouter.get('/api/masters/retailers/productClosingStock', closingStock.getRetailerPreviousClosingStock);
SfRouter.get('/api/transaction/retailers/closingStock', closingStock.getClosingStockValues);

SfRouter.get('/api/masters/retailers/retailerInfo', RetailerControll.getRetailerInfoWithClosingStock)

SfRouter.post('/api/masters/retailerLocation', RetailerControll.postLocationForCustomer)
SfRouter.put('/api/masters/retailerLocation', RetailerControll.verifyLocation)


// productApi
SfRouter.get('/api/masters/products', sfProductController.getProducts);
SfRouter.get('/api/masters/products/grouped', sfProductController.getGroupedProducts);
SfRouter.post('/api/masters/products', sfProductController.postProducts);
SfRouter.put('/api/masters/products', sfProductController.updateProduct);
SfRouter.put('/api/masters/products/productImage', sfProductController.updateProductImages);


// distributors
SfRouter.get('/api/masters/distributors', sfDistributors.getDistributors);


// routes
SfRouter.get('/api/masters/routes', sfRoutes.getRoutes);



// attendance

SfRouter.post('/api/attendance', attendance.addAttendance)
SfRouter.put('/api/attendance', attendance.closeAttendance);
SfRouter.delete('/api/attendance', attendance.closeAttendance)

SfRouter.get('/api/myTodayAttendance', attendance.getMyTodayAttendance);

SfRouter.get('/api/getMyLastAttendance', attendance.getMyLastAttendanceOfToday);



// sales - modules

SfRouter.post('/api/masters/retailers/closingStock', closingStock.closeingStock);
SfRouter.put('/api/masters/retailers/closingStock', closingStock.closeingStockUpdate);




export default SfRouter;