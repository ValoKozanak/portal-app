app.use('/api-staging/invoices', require('./routes/invoices')); // staging prefix
// alebo len:
app.use('/api/invoices', require('./routes/invoices'));
