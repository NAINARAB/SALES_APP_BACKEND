import express from "express";
import LoginControl from "../controller/general/login.mjs";
import closingStock from "../controller/sales/closingStock.mjs";
import attendance from "../controller/general/attendance.mjs";
import generalConfig from "../controller/general/generalConfig.mjs";

import RetailerControll from "../controller/masters/sfRetailers.mjs";
import sfProductController from "../controller/masters/sfProducts.mjs";
import sfDistributors from "../controller/masters/sfDistributors.mjs";
import sfRoutes from "../controller/masters/sfRoutes.mjs";
import sfMasters from "../controller/masters/sfMasters.mjs";
import userType from "../controller/masters/userType.mjs";
import userMaster from "../controller/masters/users.mjs";
import branchController from '../controller/masters/branch.mjs';
import SaleOrder from '../controller/sales/saleOrderCreation.mjs'

const SfRouter = express.Router();

//Login 
SfRouter.post('/api/login', LoginControl.getLogin)
SfRouter.post('/api/userAuth', LoginControl.getLoginBYAuth)

//Sidebar
SfRouter.get('/api/sidebar', generalConfig.getSidebarForUser);

//VisitLogs
SfRouter.get('/api/visitedPlaces', generalConfig.getVisitedLogs);
SfRouter.post('/api/visitedPlaces', generalConfig.postVisitLogs);


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
SfRouter.get('/api/masters/custom-users', userMaster.customUserGet);
SfRouter.get('/api/masters/users/salesPerson/dropDown', userMaster.salesPersonDropDown)




// retailersApi
SfRouter.get('/api/masters/retailers', RetailerControll.getSFCustomers);
SfRouter.get('/api/masters/retailers/dropDown', RetailerControll.getRetailerDropDown);
SfRouter.get('/api/masters/retailers/areaRetailers', RetailerControll.getAreaRetailers);
SfRouter.get('/api/masters/retailers/productClosingStock', closingStock.getRetailerPreviousClosingStock);
SfRouter.get('/api/masters/retailers/retailerInfo', RetailerControll.getRetailerInfoWithClosingStock)
SfRouter.get('/api/masters/retailers/retaileDetails', RetailerControll.getRetailerInfo)
SfRouter.get('/api/transaction/retailers/closingStock', closingStock.getClosingStockValues);

SfRouter.post('/api/masters/retailers', RetailerControll.addRetailers);
SfRouter.post('/api/masters/retailerLocation', RetailerControll.postLocationForCustomer)
SfRouter.post('/api/masters/retailer/convertAsRetailer', RetailerControll.convertVisitLogToRetailer)

SfRouter.put('/api/masters/retailers', RetailerControll.putRetailers);
SfRouter.put('/api/masters/retailerLocation', RetailerControll.verifyLocation)




// productApi
SfRouter.get('/api/masters/products', sfProductController.getProducts);
SfRouter.get('/api/masters/products/grouped', sfProductController.getGroupedProducts);
SfRouter.post('/api/masters/products', sfProductController.postProductsWithImage);
SfRouter.post('/api/masters/products/withoutImage', sfProductController.postProductsWithImage);
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

SfRouter.get('/api/myAttendanceHistory', attendance.getAttendanceHistory)

SfRouter.get('/api/getMyLastAttendance', attendance.getMyLastAttendanceOfToday);



// sales - modules

SfRouter.post('/api/masters/retailers/closingStock', closingStock.closeingStock);
SfRouter.put('/api/masters/retailers/closingStock', closingStock.closeingStockUpdate);

SfRouter.get('/api/masters/retailers/closingStock/myEntry', closingStock.getSalesPersonEnteredClosingStock);


// sales order creation 

SfRouter.post('/api/sales/saleOrder', SaleOrder.saleOrderCreation);


export default SfRouter;