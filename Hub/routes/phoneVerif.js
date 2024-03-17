const express = require('express');
const router = express.Router();
const phone = require('../middleware/phone');

router.get('/', (req, res) => {
    res.render('phoneVerif.ejs');
});

router.post('/verify', (req, res) => {
    if (req.body.method == 'call'){
        phone.phoneCallAUTH(req.body.phone, req.body.name);
        res.json({
            done: true,
            message: 'Dialling.'
        });
    }else{
        phone.smsAUTH(req.body.phone, req.body.name);
        res.json({
            done: true,
            message: 'Text sent'
        });
    }
    
});
module.exports = router;