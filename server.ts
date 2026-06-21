import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { dbStore, checkLowStockAndTriggerAlert } from './src/dbStore.js';
import { 
  User, Category, Brand, Product, Customer, Order, Employee, SalaryPayment, Loan, LowStockAlertLog, AdvanceSalaryRequest 
} from './src/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Logging for debugging
  app.use((req, res, next) => {
    console.log(`[API LOG] ${req.method} ${req.url}`);
    next();
  });

  // --- AUTH ENDPOINTS ---
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    
    // Simple password login check - accepts "password" for simplicity and out-of-the-box ease
    if (password !== 'password') {
      return res.status(401).json({ error: 'ভুল পাসওয়ার্ড। দয়া করে "password" ব্যবহার করুন।' });
    }
    
    const users = dbStore.getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      return res.status(404).json({ error: 'এই ইমেইল দিয়ে কোনো ব্যবহারকারী পাওয়া যায়নি।' });
    }
    
    if (user.status !== 'active') {
      return res.status(403).json({ error: 'এই অ্যাকাউন্টটি নিষ্ক্রিয় (Inactive)।' });
    }
    
    res.json({ token: 'mock-jwt-token', user });
  });

  // --- DASHBOARD ENDPOINTS ---
  app.get('/api/dashboard', (req, res) => {
    const products = dbStore.getProducts();
    const orders = dbStore.getOrders();
    const employees = dbStore.getEmployees();
    const loans = dbStore.getLoans();
    const categories = dbStore.getCategories();

    // Key stats
    const totalProducts = products.length;
    const totalStockQty = products.reduce((sum, p) => sum + p.quantity, 0);
    const stockNetWorth = products.reduce((sum, p) => sum + (p.quantity * p.cost), 0);
    const stockSellingValue = products.reduce((sum, p) => sum + (p.quantity * p.price), 0);
    
    const totalSalesValue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalCostOfSoldGoods = orders.reduce((sum, o) => {
      return sum + o.items.reduce((innerSum, item) => {
        const prod = products.find(p => p.id === item.productId);
        const costToUse = prod ? prod.cost : item.price * 0.8; // fallback
        return innerSum + (costToUse * item.quantity);
      }, 0);
    }, 0);
    const profit = totalSalesValue - totalCostOfSoldGoods;

    // Active loan total value
    const totalOutboundLoans = loans
      .filter(l => l.type === 'disbursed')
      .reduce((sum, l) => sum + l.amount, 0);
    const totalReceivedRepayments = loans
      .filter(l => l.type === 'repaid')
      .reduce((sum, l) => sum + l.amount, 0);
    const activeStaffLoanBalance = totalOutboundLoans - totalReceivedRepayments;

    // Low stock items count
    const lowStockItems = products.filter(p => p.quantity <= p.lowStockThreshold);

    // Dynamic metrics for charting
    // Categories and item count
    const categoryDistribution = categories.map(cat => {
      const count = products.filter(p => p.categoryId === cat.id).length;
      return { name: cat.name, count };
    });

    // Recent orders to show
    const recentOrders = [...orders].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

    // Sales history (last 7 days or mock days)
    const salesTimeline = [
      { date: 'Sun', amount: 35000, profit: 8000 },
      { date: 'Mon', amount: 48000, profit: 12000 },
      { date: 'Tue', amount: 12000, profit: 3100 },
      { date: 'Wed', amount: 65000, profit: 16500 },
      { date: 'Thu', amount: 28000, profit: 7000 },
      { date: 'Fri', amount: 95000, profit: 24000 },
      { date: 'Sat', amount: totalSalesValue > 0 ? totalSalesValue % 100000 : 42000, profit: profit > 0 ? Math.floor(profit % 30000) : 10000 }
    ];

    res.json({
      summary: {
        totalProducts,
        totalStockQty,
        stockNetWorth,
        stockSellingValue,
        totalSalesValue,
        profit,
        activeStaffLoanBalance,
        lowStockCount: lowStockItems.length,
        employeeCount: employees.length
      },
      lowStockItems,
      categoryDistribution,
      salesTimeline,
      recentOrders
    });
  });

  // --- PRODUCTS ENDPOINTS ---
  app.get('/api/products', (req, res) => {
    res.json(dbStore.getProducts());
  });

  app.post('/api/products', (req, res) => {
    const data: Partial<Product> = req.body;
    if (!data.name || !data.sku || data.quantity === undefined || data.price === undefined) {
      return res.status(400).json({ error: 'Name, SKU, Quantity, and Price are required.' });
    }

    const products = dbStore.getProducts();
    const newProduct: Product = {
      id: 'p_' + Date.now(),
      name: data.name,
      sku: data.sku,
      categoryId: data.categoryId || '',
      brandId: data.brandId || '',
      price: Number(data.price),
      cost: Number(data.cost || 0),
      quantity: Number(data.quantity),
      lowStockThreshold: Number(data.lowStockThreshold || 5),
      description: data.description || '',
      supplierId: data.supplierId || '',
      createdAt: new Date().toISOString()
    };

    products.push(newProduct);
    dbStore.saveProducts(products);

    // Trigger alert checking
    checkLowStockAndTriggerAlert(newProduct.id, newProduct.name, newProduct.quantity, newProduct.lowStockThreshold);

    res.status(201).json(newProduct);
  });

  app.put('/api/products/:id', (req, res) => {
    const { id } = req.params;
    const updateBody: Partial<Product> = req.body;
    const products = dbStore.getProducts();
    const index = products.findIndex(p => p.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    const updatedProduct = {
      ...products[index],
      ...updateBody,
      price: updateBody.price !== undefined ? Number(updateBody.price) : products[index].price,
      cost: updateBody.cost !== undefined ? Number(updateBody.cost) : products[index].cost,
      quantity: updateBody.quantity !== undefined ? Number(updateBody.quantity) : products[index].quantity,
      lowStockThreshold: updateBody.lowStockThreshold !== undefined ? Number(updateBody.lowStockThreshold) : products[index].lowStockThreshold
    };

    products[index] = updatedProduct;
    dbStore.saveProducts(products);

    // Recheck stock alert limits
    checkLowStockAndTriggerAlert(updatedProduct.id, updatedProduct.name, updatedProduct.quantity, updatedProduct.lowStockThreshold);

    res.json(updatedProduct);
  });

  app.delete('/api/products/:id', (req, res) => {
    const { id } = req.params;
    const products = dbStore.getProducts();
    const filtered = products.filter(p => p.id !== id);

    if (products.length === filtered.length) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    dbStore.saveProducts(filtered);
    res.json({ success: true, message: 'পণ্যটি সফলভাবে মুছে ফেলা হয়েছে।' });
  });

  // --- SUPPLIERS ENDPOINTS ---
  app.get('/api/suppliers', (req, res) => {
    res.json(dbStore.getSuppliers());
  });

  app.post('/api/suppliers', (req, res) => {
    const { name, companyName, phone, email, address } = req.body;
    if (!name || !companyName) {
      return res.status(400).json({ error: 'সরবরাহকারীর নাম এবং কোম্পানির নাম আবশ্যক।' });
    }

    const suppliers = dbStore.getSuppliers();
    const newSupplier = {
      id: 's_' + Date.now(),
      name,
      companyName,
      phone: phone || '',
      email: email || '',
      address: address || '',
      createdAt: new Date().toISOString()
    };
    suppliers.push(newSupplier);
    dbStore.saveSuppliers(suppliers);
    res.status(201).json(newSupplier);
  });

  // --- CATEGORIES ENDPOINTS ---
  app.get('/api/categories', (req, res) => {
    res.json(dbStore.getCategories());
  });

  app.post('/api/categories', (req, res) => {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Category name is required.' });

    const categories = dbStore.getCategories();
    const newCategory: Category = {
      id: 'c_' + Date.now(),
      name,
      description: description || '',
      createdAt: new Date().toISOString()
    };

    categories.push(newCategory);
    dbStore.saveCategories(categories);
    res.status(201).json(newCategory);
  });

  app.put('/api/categories/:id', (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;
    const categories = dbStore.getCategories();
    const cat = categories.find(c => c.id === id);
    if (!cat) return res.status(404).json({ error: 'Category not found.' });

    cat.name = name || cat.name;
    cat.description = description !== undefined ? description : cat.description;
    dbStore.saveCategories(categories);
    res.json(cat);
  });

  app.delete('/api/categories/:id', (req, res) => {
    const { id } = req.params;
    const categories = dbStore.getCategories();
    const filtered = categories.filter(c => c.id !== id);
    dbStore.saveCategories(filtered);
    res.json({ success: true });
  });

  // --- BRANDS ENDPOINTS ---
  app.get('/api/brands', (req, res) => {
    res.json(dbStore.getBrands());
  });

  app.post('/api/brands', (req, res) => {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Brand name is required.' });

    const brands = dbStore.getBrands();
    const newBrand: Brand = {
      id: 'b_' + Date.now(),
      name,
      description: description || '',
      createdAt: new Date().toISOString()
    };

    brands.push(newBrand);
    dbStore.saveBrands(brands);
    res.status(201).json(newBrand);
  });

  app.put('/api/brands/:id', (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;
    const brands = dbStore.getBrands();
    const br = brands.find(b => b.id === id);
    if (!br) return res.status(404).json({ error: 'Brand not found.' });

    br.name = name || br.name;
    br.description = description !== undefined ? description : br.description;
    dbStore.saveBrands(brands);
    res.json(br);
  });

  app.delete('/api/brands/:id', (req, res) => {
    const { id } = req.params;
    const brands = dbStore.getBrands();
    const filtered = brands.filter(b => b.id !== id);
    dbStore.saveBrands(filtered);
    res.json({ success: true });
  });

  // --- CUSTOMERS ENDPOINTS ---
  app.get('/api/customers', (req, res) => {
    res.json(dbStore.getCustomers());
  });

  app.post('/api/customers', (req, res) => {
    const { name, email, phone, address } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ error: 'Name and Phone number are required.' });
    }

    const customers = dbStore.getCustomers();
    const newCustomer: Customer = {
      id: 'cs_' + Date.now(),
      name,
      email: email || '',
      phone,
      address: address || '',
      createdAt: new Date().toISOString()
    };
    customers.push(newCustomer);
    dbStore.saveCustomers(customers);
    res.status(201).json(newCustomer);
  });

  // --- ORDERS ENDPOINTS ---
  app.get('/api/orders', (req, res) => {
    res.json(dbStore.getOrders());
  });

  app.post('/api/orders', (req, res) => {
    const { customerId, items, discount, paymentStatus, createdBy } = req.body;
    if (!customerId || !items || !items.length) {
      return res.status(400).json({ error: 'Customer and items list are required.' });
    }

    const customers = dbStore.getCustomers();
    const matchingCustomer = customers.find(c => c.id === customerId);
    if (!matchingCustomer) {
      return res.status(404).json({ error: 'Customer not found.' });
    }

    const products = dbStore.getProducts();
    const resolvedItems = [];
    let subtotal = 0;

    // Validate quantities and calculate totals
    for (const orderItem of items) {
      const prod = products.find(p => p.id === orderItem.productId);
      if (!prod) {
        return res.status(404).json({ error: `Product ID ${orderItem.productId} not found.` });
      }
      if (prod.quantity < orderItem.quantity) {
        return res.status(400).json({ 
          error: `পণ্য "${prod.name}"-এর পর্যাপ্ত স্টক নেই। বর্তমান মজুদ: ${prod.quantity}` 
        });
      }
      
      const itemPrice = orderItem.price || prod.price;
      subtotal += itemPrice * orderItem.quantity;
      
      resolvedItems.push({
        productId: prod.id,
        name: prod.name,
        quantity: orderItem.quantity,
        price: itemPrice
      });
    }

    const calculatedDiscount = Number(discount || 0);
    const totalAmount = Math.max(0, subtotal - calculatedDiscount);

    // Decrement item quantities in stock and check for alerts
    for (const item of resolvedItems) {
      const prod = products.find(p => p.id === item.productId)!;
      prod.quantity -= item.quantity;
      checkLowStockAndTriggerAlert(prod.id, prod.name, prod.quantity, prod.lowStockThreshold);
    }
    dbStore.saveProducts(products);

    const orders = dbStore.getOrders();
    const orderCountString = String(orders.length + 1).padStart(4, '0');
    const invoiceNumber = `INV-${new Date().getFullYear()}-${orderCountString}`;

    const newOrder: Order = {
      id: 'o_' + Date.now(),
      invoiceNumber,
      customerId,
      customerName: matchingCustomer.name,
      items: resolvedItems,
      subtotal,
      discount: calculatedDiscount,
      totalAmount,
      paymentStatus: paymentStatus || 'Paid',
      createdAt: new Date().toISOString(),
      createdBy: createdBy || 'u1'
    };

    orders.push(newOrder);
    dbStore.saveOrders(orders);
    res.status(201).json(newOrder);
  });

  // --- EMPLOYEES ENDPOINTS ---
  app.get('/api/employees', (req, res) => {
    res.json(dbStore.getEmployees());
  });

  app.post('/api/employees', (req, res) => {
    const { name, email, phone, designation, joinedDate, salaryAmount } = req.body;
    if (!name || !email || !designation || !salaryAmount) {
      return res.status(400).json({ error: 'Name, Email, Designation and Salary are required.' });
    }

    const employees = dbStore.getEmployees();
    const newEmployee: Employee = {
      id: 'emp_' + Date.now(),
      name,
      email,
      phone: phone || '',
      designation,
      joinedDate: joinedDate || new Date().toISOString().split('T')[0],
      salaryAmount: Number(salaryAmount),
      status: 'active'
    };

    employees.push(newEmployee);
    dbStore.saveEmployees(employees);

    // Also auto-create a user profile for them with employee role
    const users = dbStore.getUsers();
    if (!users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      users.push({
        id: 'u_' + Date.now(),
        name,
        email,
        role: 'employee',
        status: 'active',
        phone
      });
      dbStore.saveUsers(users);
    }

    res.status(201).json(newEmployee);
  });

  app.put('/api/employees/:id', (req, res) => {
    const { id } = req.params;
    const bodyObj: Partial<Employee> = req.body;
    const employees = dbStore.getEmployees();
    const emp = employees.find(e => e.id === id);

    if (!emp) return res.status(404).json({ error: 'Employee not found.' });

    Object.assign(emp, bodyObj);
    if (bodyObj.salaryAmount !== undefined) emp.salaryAmount = Number(bodyObj.salaryAmount);
    dbStore.saveEmployees(employees);
    res.json(emp);
  });

  app.delete('/api/employees/:id', (req, res) => {
    const { id } = req.params;
    const employees = dbStore.getEmployees();
    const filtered = employees.filter(e => e.id !== id);
    dbStore.saveEmployees(filtered);
    res.json({ success: true });
  });

  // --- SALARIES ENDPOINTS ---
  app.get('/api/salaries', (req, res) => {
    res.json(dbStore.getSalaries());
  });

  app.post('/api/salaries', (req, res) => {
    const { employeeId, month, amount } = req.body;
    if (!employeeId || !month || !amount) {
      return res.status(400).json({ error: 'Employee, Month and Amount are required.' });
    }

    const employees = dbStore.getEmployees();
    const matchingEmployee = employees.find(e => e.id === employeeId);
    if (!matchingEmployee) return res.status(404).json({ error: 'Employee not found.' });

    const salaries = dbStore.getSalaries();
    const newPayment: SalaryPayment = {
      id: 'sal_' + Date.now(),
      employeeId,
      employeeName: matchingEmployee.name,
      month,
      amount: Number(amount),
      paymentDate: new Date().toISOString(),
      status: 'paid'
    };

    salaries.push(newPayment);
    dbStore.saveSalaries(salaries);
    res.status(201).json(newPayment);
  });

  // --- LOANS ENDPOINTS ---
  app.get('/api/loans', (req, res) => {
    res.json(dbStore.getLoans());
  });

  app.post('/api/loans', (req, res) => {
    const { employeeId, amount, type, description } = req.body;
    if (!employeeId || !amount || !type) {
      return res.status(400).json({ error: 'Employee, Amount and Type (disbursed/repaid) are required.' });
    }

    const employees = dbStore.getEmployees();
    const matchingEmployee = employees.find(e => e.id === employeeId);
    if (!matchingEmployee) return res.status(404).json({ error: 'Employee not found.' });

    const loans = dbStore.getLoans();
    const newLoan: Loan = {
      id: 'l_' + Date.now(),
      employeeId,
      employeeName: matchingEmployee.name,
      amount: Number(amount),
      type,
      date: new Date().toISOString().split('T')[0],
      description: description || ''
    };

    loans.push(newLoan);
    dbStore.saveLoans(loans);
    res.status(201).json(newLoan);
  });

  // --- SYSTEM LOW STOCK ALERTS LOGS ---
  app.get('/api/alerts', (req, res) => {
    res.json(dbStore.getAlerts());
  });

  app.delete('/api/alerts', (req, res) => {
    dbStore.saveAlerts([]);
    res.json({ success: true, message: 'অ্যালার্ট লগ খালি করা হয়েছে।' });
  });

  // --- USERS / PROFILE ENDPOINTS ---
  app.get('/api/users', (req, res) => {
    res.json(dbStore.getUsers());
  });

  app.post('/api/users', (req, res) => {
    const { name, email, phone, designation, role, allowedMenus, executorId } = req.body;
    if (!name || !email || !role) {
      return res.status(400).json({ error: 'নাম, ইমেইল এবং রোল নির্বাচন করা আবশ্যক।' });
    }

    const users = dbStore.getUsers();
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      return res.status(400).json({ error: 'এই ইমেইল দিয়ে ইতঃপূর্বে ব্যবহারকারী রেজিস্টার করা হয়েছে।' });
    }

    if (executorId) {
      const executor = users.find(u => u.id === executorId);
      if (!executor) {
        return res.status(403).json({ error: 'কারেন্ট সেশন ভেরিফিকেশন ব্যর্থ হয়েছে।' });
      }
      if (executor.role === 'employee') {
        return res.status(403).json({ error: '🔒 সেশন রুলঃ কর্মচারীরা কোনো ইউজার যোগ করতে পারবেন না।' });
      }
      if (executor.role === 'admin' && role !== 'employee') {
        return res.status(403).json({ error: '🔒 এডমিন অধিকারঃ আপনার শুধুমাত্র কর্মচারী (employee) শ্রেণির ইউজার যোগ করার পারমিশন আছে।' });
      }
    }

    const newUser: User = {
      id: 'u_' + Date.now(),
      name,
      email,
      phone: phone || '',
      designation: designation || (role === 'employee' ? 'কোম্পানি স্টাফ' : role === 'admin' ? 'কোম্পানি এডমিন' : 'সুপার এডমিন'),
      role,
      status: 'active',
      allowedMenus: allowedMenus || (role === 'employee' ? ['dashboard', 'orders', 'profile'] : ['dashboard', 'products', 'categories', 'orders', 'crm', 'reports', 'alerts', 'profile']),
      joinedDate: new Date().toISOString().split('T')[0],
      employeeId: 'EMP-' + Math.floor(1000 + Math.random() * 9000),
      bio: ''
    };

    users.push(newUser);
    dbStore.saveUsers(users);

    // Also automatically create an HRM Employee entry corresponding to it so directories sync beautifully!
    const employees = dbStore.getEmployees();
    if (!employees.some(e => e.email.toLowerCase() === email.toLowerCase())) {
      const newEmp: Employee = {
        id: 'emp_' + Date.now(),
        name,
        email,
        phone: phone || '+8801700000000',
        designation: newUser.designation || 'কোম্পানি স্টাফ',
        joinedDate: newUser.joinedDate || new Date().toISOString().split('T')[0],
        salaryAmount: role === 'employee' ? 25000 : role === 'admin' ? 45000 : 75000,
        status: 'active'
      };
      employees.push(newEmp);
      dbStore.saveEmployees(employees);
    }

    res.status(201).json(newUser);
  });

  app.put('/api/users/:id', (req, res) => {
    const { id } = req.params;
    const { 
      name, email, phone, bio, designation, address, nid, bloodGroup, employeeId, photo, birthDate,
      role, status, allowedMenus, executorId 
    } = req.body;
    
    const users = dbStore.getUsers();
    const userIndex = users.findIndex(u => u.id === id);
    if (userIndex === -1) {
      return res.status(404).json({ error: 'ব্যবহারকারী খুঁজে পাওয়া যায়নি।' });
    }

    const oldUser = users[userIndex];

    // Auth & authorization validation if executorId is provided
    if (executorId) {
      const executor = users.find(u => u.id === executorId);
      if (!executor) {
        return res.status(403).json({ error: 'অ্যাক্সেস ডিনাইডঃ সঠিক কারেন্ট ইউজার পাওয়া যায়নি।' });
      }
      
      // If changing role/status/allowedMenus (administrative tasks)
      if (role !== undefined || status !== undefined || allowedMenus !== undefined) {
        if (executor.role === 'employee') {
          return res.status(403).json({ error: '🔒 কর্মচারীদের কোনো ব্যবহারকারীর ইনফরমেশন বা পারমিশন মডিফাই করার অনুমতি নেই।' });
        }
        
        // If administrator (admin) tries to modify admin/supper_admin
        if (executor.role === 'admin') {
          if (oldUser.role === 'admin' || oldUser.role === 'supper_admin') {
             // Admin cannot modify other admins or super admins
             if (id !== executorId) { // except editing their own basic bio/profile
               return res.status(403).json({ error: '🔒 এডমিনরা অন্য এডমিন অথবা সুপার এডমিনের পারমিশন বা স্ট্যাটাস ব্লক করতে পারবেন না।' });
             }
          }
          // Admin cannot escalate someone to admin or supper_admin
          if (role && role !== 'employee') {
            return res.status(403).json({ error: '🔒 এডমিন শুধুমাত্র কর্মচারীদের পারমিশন পরিচালনা বা এড করতে পারেন।' });
          }
        }
      }
    }

    const updatedUser = {
      ...oldUser,
      name: name !== undefined ? name : oldUser.name,
      email: email !== undefined ? email : oldUser.email,
      phone: phone !== undefined ? phone : oldUser.phone,
      bio: bio !== undefined ? bio : oldUser.bio,
      designation: designation !== undefined ? designation : oldUser.designation,
      address: address !== undefined ? address : oldUser.address,
      nid: nid !== undefined ? nid : oldUser.nid,
      bloodGroup: bloodGroup !== undefined ? bloodGroup : oldUser.bloodGroup,
      employeeId: employeeId !== undefined ? employeeId : oldUser.employeeId,
      photo: photo !== undefined ? photo : oldUser.photo,
      birthDate: birthDate !== undefined ? birthDate : oldUser.birthDate,
      role: role !== undefined ? role : oldUser.role,
      status: status !== undefined ? status : oldUser.status,
      allowedMenus: allowedMenus !== undefined ? allowedMenus : oldUser.allowedMenus
    };
    
    users[userIndex] = updatedUser as any;
    dbStore.saveUsers(users);

    // Sync with corresponding Employee if email matches
    const employees = dbStore.getEmployees();
    const empIndex = employees.findIndex(e => e.email.toLowerCase() === oldUser.email.toLowerCase());
    if (empIndex !== -1) {
      employees[empIndex] = {
        ...employees[empIndex],
        name: name !== undefined ? name : employees[empIndex].name,
        email: email !== undefined ? email : employees[empIndex].email,
        phone: phone !== undefined ? phone : employees[empIndex].phone,
        designation: designation !== undefined ? designation : employees[empIndex].designation,
        status: status !== undefined ? (status === 'active' ? 'active' : 'inactive') : employees[empIndex].status
      };
      dbStore.saveEmployees(employees);
    }

    res.json(updatedUser);
  });

  // --- ADVANCED SALARY ENDPOINTS ---
  app.get('/api/advance-salary', (req, res) => {
    res.json(dbStore.getAdvanceSalaries());
  });

  app.post('/api/advance-salary', (req, res) => {
    const { employeeId, amount, month, reason } = req.body;
    if (!employeeId || !amount || !month || !reason) {
      return res.status(400).json({ error: 'সবগুলো ইনপুট ফিল্ড পূরণ করা আবশ্যক।' });
    }

    const employees = dbStore.getEmployees();
    const emp = employees.find(e => e.id === employeeId || e.email.toLowerCase() === employeeId.toLowerCase());
    if (!emp) {
      return res.status(404).json({ error: 'স্টাফ খুঁজে পাওয়া যায়নি।' });
    }

    const advances = dbStore.getAdvanceSalaries();
    const newRequest: AdvanceSalaryRequest = {
      id: 'adv_' + Date.now(),
      employeeId: emp.id,
      employeeName: emp.name,
      amount: Number(amount),
      month,
      reason,
      requestDate: new Date().toISOString().split('T')[0],
      status: 'pending'
    };

    advances.unshift(newRequest);
    dbStore.saveAdvanceSalaries(advances);
    res.status(201).json(newRequest);
  });

  app.put('/api/advance-salary/:id', (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // 'approved' | 'rejected'
    
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'ভুল স্ট্যাটাস।' });
    }

    const advances = dbStore.getAdvanceSalaries();
    const advIndex = advances.findIndex(a => a.id === id);
    if (advIndex === -1) {
      return res.status(404).json({ error: 'অগ্রিম বেতন আবেদন পাওয়া যায়নি।' });
    }

    const request = advances[advIndex];
    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'এই আবেদনটি ইতিমধ্যে রিভিউ করা হয়েছে।' });
    }

    request.status = status;
    request.actionDate = new Date().toISOString().split('T')[0];
    dbStore.saveAdvanceSalaries(advances);

    // If approved, create a corresponding disbursement in loan book
    if (status === 'approved') {
      const loans = dbStore.getLoans();
      const newLoan: Loan = {
        id: 'l_' + Date.now(),
        employeeId: request.employeeId,
        employeeName: request.employeeName,
        amount: request.amount,
        type: 'disbursed',
        date: new Date().toISOString().split('T')[0],
        description: `অগ্রিম বেতন অনুমোদন (${request.month}) - কারণ: ${request.reason}`
      };
      loans.push(newLoan);
      dbStore.saveLoans(loans);
    }

    res.json(request);
  });


  // --- VITE MIDDLEWARE SETUP ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SERVER START] Server running on http://localhost:${PORT}`);
  });
}

startServer();
