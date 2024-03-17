const countriesData = [
    { flag: '🇬🇧', country: 'United Kingdom', code: 'GB', dialCode: '+44' },
    { flag: '🇦🇫', country: 'Afghanistan', code: 'AF', dialCode: '+93' },
    { flag: '🇦🇱', country: 'Albania', code: 'AL', dialCode: '+355' },
    { flag: '🇩🇿', country: 'Algeria', code: 'DZ', dialCode: '+213' },
    { flag: '🇦🇩', country: 'Andorra', code: 'AD', dialCode: '+376' },
    { flag: '🇦🇴', country: 'Angola', code: 'AO', dialCode: '+244' },
    { flag: '🇦🇬', country: 'Antigua and Barbuda', code: 'AG', dialCode: '+1' },
    { flag: '🇦🇷', country: 'Argentina', code: 'AR', dialCode: '+54' },
    { flag: '🇦🇲', country: 'Armenia', code: 'AM', dialCode: '+374' },
    { flag: '🇦🇺', country: 'Australia', code: 'AU', dialCode: '+61' },
    { flag: '🇦🇹', country: 'Austria', code: 'AT', dialCode: '+43' },
    { flag: '🇦🇿', country: 'Azerbaijan', code: 'AZ', dialCode: '+994' },
    { flag: '🇧🇸', country: 'Bahamas', code: 'BS', dialCode: '+1' },
    { flag: '🇧🇭', country: 'Bahrain', code: 'BH', dialCode: '+973' },
    { flag: '🇧🇩', country: 'Bangladesh', code: 'BD', dialCode: '+880' },
    { flag: '🇧🇧', country: 'Barbados', code: 'BB', dialCode: '+1' },
    { flag: '🇧🇾', country: 'Belarus', code: 'BY', dialCode: '+375' },
    { flag: '🇧🇪', country: 'Belgium', code: 'BE', dialCode: '+32' },
    { flag: '🇧🇿', country: 'Belize', code: 'BZ', dialCode: '+501' },
    { flag: '🇧🇯', country: 'Benin', code: 'BJ', dialCode: '+229' },
    { flag: '🇧🇹', country: 'Bhutan', code: 'BT', dialCode: '+975' },
    { flag: '🇧🇴', country: 'Bolivia', code: 'BO', dialCode: '+591' },
    { flag: '🇧🇦', country: 'Bosnia and Herzegovina', code: 'BA', dialCode: '+387' },
    { flag: '🇧🇼', country: 'Botswana', code: 'BW', dialCode: '+267' },
    { flag: '🇧🇷', country: 'Brazil', code: 'BR', dialCode: '+55' },
    { flag: '🇧🇳', country: 'Brunei', code: 'BN', dialCode: '+673' },
    { flag: '🇧🇬', country: 'Bulgaria', code: 'BG', dialCode: '+359' },
    { flag: '🇧🇫', country: 'Burkina Faso', code: 'BF', dialCode: '+226' },
    { flag: '🇧🇮', country: 'Burundi', code: 'BI', dialCode: '+257' },
    { flag: '🇰🇭', country: 'Cambodia', code: 'KH', dialCode: '+855' },
    { flag: '🇨🇲', country: 'Cameroon', code: 'CM', dialCode: '+237' },
    { flag: '🇨🇦', country: 'Canada', code: 'CA', dialCode: '+1' },
    { flag: '🇨🇻', country: 'Cape Verde', code: 'CV', dialCode: '+238' },
    { flag: '🇨🇫', country: 'Central African Republic', code: 'CF', dialCode: '+236' },
    { flag: '🇹🇩', country: 'Chad', code: 'TD', dialCode: '+235' },
    { flag: '🇨🇱', country: 'Chile', code: 'CL', dialCode: '+56' },
    { flag: '🇨🇳', country: 'China', code: 'CN', dialCode: '+86' },
    { flag: '🇨🇴', country: 'Colombia', code: 'CO', dialCode: '+57' },
    { flag: '🇰🇲', country: 'Comoros', code: 'KM', dialCode: '+269' },
    { flag: '🇨🇬', country: 'Congo (Congo-Brazzaville)', code: 'CG', dialCode: '+242' },
    { flag: '🇨🇩', country: 'Congo (Congo-Kinshasa)', code: 'CD', dialCode: '+243' },
    { flag: '🇨🇷', country: 'Costa Rica', code: 'CR', dialCode: '+506' },
    { flag: '🇭🇷', country: 'Croatia', code: 'HR', dialCode: '+385' },
    { flag: '🇨🇺', country: 'Cuba', code: 'CU', dialCode: '+53' },
    { flag: '🇨🇾', country: 'Cyprus', code: 'CY', dialCode: '+357' },
    { flag: '🇨🇿', country: 'Czech Republic', code: 'CZ', dialCode: '+420' },
    { flag: '🇩🇰', country: 'Denmark', code: 'DK', dialCode: '+45' },
    { flag: '🇩🇯', country: 'Djibouti', code: 'DJ', dialCode: '+253' },
    { flag: '🇩🇲', country: 'Dominica', code: 'DM', dialCode: '+1' },
    { flag: '🇩🇴', country: 'Dominican Republic', code: 'DO', dialCode: '+1' },
    { flag: '🇪🇨', country: 'Ecuador', code: 'EC', dialCode: '+593' },
    { flag: '🇪🇬', country: 'Egypt', code: 'EG', dialCode: '+20' },
    { flag: '🇸🇻', country: 'El Salvador', code: 'SV', dialCode: '+503' },
    { flag: '🇬🇶', country: 'Equatorial Guinea', code: 'GQ', dialCode: '+240' },
    { flag: '🇪🇷', country: 'Eritrea', code: 'ER', dialCode: '+291' },
    { flag: '🇪🇪', country: 'Estonia', code: 'EE', dialCode: '+372' },
    { flag: '🇪🇹', country: 'Ethiopia', code: 'ET', dialCode: '+251' },
    { flag: '🇫🇯', country: 'Fiji', code: 'FJ', dialCode: '+679' },
    { flag: '🇫🇮', country: 'Finland', code: 'FI', dialCode: '+358' },
    { flag: '🇫🇷', country: 'France', code: 'FR', dialCode: '+33' },
    { flag: '🇬🇦', country: 'Gabon', code: 'GA', dialCode: '+241' },
    { flag: '🇬🇲', country: 'Gambia', code: 'GM', dialCode: '+220' },
    { flag: '🇬🇪', country: 'Georgia', code: 'GE', dialCode: '+995' },
    { flag: '🇩🇪', country: 'Germany', code: 'DE', dialCode: '+49' },
    { flag: '🇬🇭', country: 'Ghana', code: 'GH', dialCode: '+233' },
    { flag: '🇬🇷', country: 'Greece', code: 'GR', dialCode: '+30' },
    { flag: '🇬🇩', country: 'Grenada', code: 'GD', dialCode: '+1' },
    { flag: '🇬🇹', country: 'Guatemala', code: 'GT', dialCode: '+502' },
    { flag: '🇬🇳', country: 'Guinea', code: 'GN', dialCode: '+224' },
    { flag: '🇬🇼', country: 'Guinea-Bissau', code: 'GW', dialCode: '+245' },
    { flag: '🇬🇾', country: 'Guyana', code: 'GY', dialCode: '+592' },
    { flag: '🇭🇹', country: 'Haiti', code: 'HT', dialCode: '+509' },
    { flag: '🇭🇳', country: 'Honduras', code: 'HN', dialCode: '+504' },
    { flag: '🇭🇰', country: 'Hong Kong SAR China', code: 'HK', dialCode: '+852' },
    { flag: '🇭🇺', country: 'Hungary', code: 'HU', dialCode: '+36' },
    { flag: '🇮🇸', country: 'Iceland', code: 'IS', dialCode: '+354' },
    { flag: '🇮🇳', country: 'India', code: 'IN', dialCode: '+91' },
    { flag: '🇮🇩', country: 'Indonesia', code: 'ID', dialCode: '+62' },
    { flag: '🇮🇷', country: 'Iran', code: 'IR', dialCode: '+98' },
    { flag: '🇮🇶', country: 'Iraq', code: 'IQ', dialCode: '+964' },
    { flag: '🇮🇪', country: 'Ireland', code: 'IE', dialCode: '+353' },
    { flag: '🇮🇱', country: 'Israel', code: 'IL', dialCode: '+972' },
    { flag: '🇮🇹', country: 'Italy', code: 'IT', dialCode: '+39' },
    { flag: '🇯🇲', country: 'Jamaica', code: 'JM', dialCode: '+1' },
    { flag: '🇯🇵', country: 'Japan', code: 'JP', dialCode: '+81' },
    { flag: '🇯🇴', country: 'Jordan', code: 'JO', dialCode: '+962' },
    { flag: '🇰🇿', country: 'Kazakhstan', code: 'KZ', dialCode: '+7' },
    { flag: '🇰🇪', country: 'Kenya', code: 'KE', dialCode: '+254' },
    { flag: '🇰🇮', country: 'Kiribati', code: 'KI', dialCode: '+686' },
    { flag: '🇰🇷', country: 'South Korea', code: 'KR', dialCode: '+82' },
    { flag: '🇽🇰', country: 'Kosovo', code: 'XK', dialCode: '+383' },
    { flag: '🇰🇼', country: 'Kuwait', code: 'KW', dialCode: '+965' },
    { flag: '🇰🇬', country: 'Kyrgyzstan', code: 'KG', dialCode: '+996' },
    { flag: '🇱🇦', country: 'Laos', code: 'LA', dialCode: '+856' },
    { flag: '🇱🇻', country: 'Latvia', code: 'LV', dialCode: '+371' },
    { flag: '🇱🇧', country: 'Lebanon', code: 'LB', dialCode: '+961' },
    { flag: '🇱🇸', country: 'Lesotho', code: 'LS', dialCode: '+266' },
    { flag: '🇱🇷', country: 'Liberia', code: 'LR', dialCode: '+231' },
    { flag: '🇱🇾', country: 'Libya', code: 'LY', dialCode: '+218' },
    { flag: '🇱🇮', country: 'Liechtenstein', code: 'LI', dialCode: '+423' },
    { flag: '🇱🇹', country: 'Lithuania', code: 'LT', dialCode: '+370' },
    { flag: '🇱🇺', country: 'Luxembourg', code: 'LU', dialCode: '+352' },
    { flag: '🇲🇴', country: 'Macao SAR China', code: 'MO', dialCode: '+853' },
    { flag: '🇲🇰', country: 'North Macedonia', code: 'MK', dialCode: '+389' },
    { flag: '🇲🇬', country: 'Madagascar', code: 'MG', dialCode: '+261' },
    { flag: '🇲🇼', country: 'Malawi', code: 'MW', dialCode: '+265' },
    { flag: '🇲🇾', country: 'Malaysia', code: 'MY', dialCode: '+60' },
    { flag: '🇲🇻', country: 'Maldives', code: 'MV', dialCode: '+960' },
    { flag: '🇲🇱', country: 'Mali', code: 'ML', dialCode: '+223' },
    { flag: '🇲🇹', country: 'Malta', code: 'MT', dialCode: '+356' },
    { flag: '🇲🇭', country: 'Marshall Islands', code: 'MH', dialCode: '+692' },
    { flag: '🇲🇷', country: 'Mauritania', code: 'MR', dialCode: '+222' },
    { flag: '🇲🇺', country: 'Mauritius', code: 'MU', dialCode: '+230' },
    { flag: '🇲🇽', country: 'Mexico', code: 'MX', dialCode: '+52' },
    { flag: '🇲🇩', country: 'Moldova', code: 'MD', dialCode: '+373' },
    { flag: '🇲🇨', country: 'Monaco', code: 'MC', dialCode: '+377' },
    { flag: '🇲🇳', country: 'Mongolia', code: 'MN', dialCode: '+976' },
    { flag: '🇲🇪', country: 'Montenegro', code: 'ME', dialCode: '+382' },
    { flag: '🇲🇦', country: 'Morocco', code: 'MA', dialCode: '+212' },
    { flag: '🇲🇿', country: 'Mozambique', code: 'MZ', dialCode: '+258' },
    { flag: '🇲🇲', country: 'Myanmar (Burma)', code: 'MM', dialCode: '+95' },
    { flag: '🇳🇦', country: 'Namibia', code: 'NA', dialCode: '+264' },
    { flag: '🇳🇷', country: 'Nauru', code: 'NR', dialCode: '+674' },
    { flag: '🇳🇵', country: 'Nepal', code: 'NP', dialCode: '+977' },
    { flag: '🇳🇱', country: 'Netherlands', code: 'NL', dialCode: '+31' },
    { flag: '🇳🇨', country: 'New Caledonia', code: 'NC', dialCode: '+687' },
    { flag: '🇳🇿', country: 'New Zealand', code: 'NZ', dialCode: '+64' },
    { flag: '🇳🇮', country: 'Nicaragua', code: 'NI', dialCode: '+505' },
    { flag: '🇳🇪', country: 'Niger', code: 'NE', dialCode: '+227' },
    { flag: '🇳🇬', country: 'Nigeria', code: 'NG', dialCode: '+234' },
    { flag: '🇰🇵', country: 'North Korea', code: 'KP', dialCode: '+850' },
    { flag: '🇳🇴', country: 'Norway', code: 'NO', dialCode: '+47' },
    { flag: '🇴🇲', country: 'Oman', code: 'OM', dialCode: '+968' },
    { flag: '🇵🇰', country: 'Pakistan', code: 'PK', dialCode: '+92' },
    { flag: '🇵🇼', country: 'Palau', code: 'PW', dialCode: '+680' },
    { flag: '🇵🇸', country: 'Palestinian Territories', code: 'PS', dialCode: '+970' },
    { flag: '🇵🇦', country: 'Panama', code: 'PA', dialCode: '+507' },
    { flag: '🇵🇬', country: 'Papua New Guinea', code: 'PG', dialCode: '+675' },
    { flag: '🇵🇾', country: 'Paraguay', code: 'PY', dialCode: '+595' },
    { flag: '🇵🇪', country: 'Peru', code: 'PE', dialCode: '+51' },
    { flag: '🇵🇭', country: 'Philippines', code: 'PH', dialCode: '+63' },
    { flag: '🇵🇱', country: 'Poland', code: 'PL', dialCode: '+48' },
    { flag: '🇵🇹', country: 'Portugal', code: 'PT', dialCode: '+351' },
    { flag: '🇵🇷', country: 'Puerto Rico', code: 'PR', dialCode: '+1' },
    { flag: '🇶🇦', country: 'Qatar', code: 'QA', dialCode: '+974' },
    { flag: '🇷🇴', country: 'Romania', code: 'RO', dialCode: '+40' },
    { flag: '🇷🇺', country: 'Russia', code: 'RU', dialCode: '+7' },
    { flag: '🇷🇼', country: 'Rwanda', code: 'RW', dialCode: '+250' },
    { flag: '🇰🇳', country: 'Saint Kitts and Nevis', code: 'KN', dialCode: '+1' },
    { flag: '🇱🇨', country: 'Saint Lucia', code: 'LC', dialCode: '+1' },
    { flag: '🇻🇨', country: 'Saint Vincent and the Grenadines', code: 'VC', dialCode: '+1' },
    { flag: '🇼🇸', country: 'Samoa', code: 'WS', dialCode: '+685' },
    { flag: '🇸🇲', country: 'San Marino', code: 'SM', dialCode: '+378' },
    { flag: '🇸🇹', country: 'São Tomé and Príncipe', code: 'ST', dialCode: '+239' },
    { flag: '🇸🇦', country: 'Saudi Arabia', code: 'SA', dialCode: '+966' },
    { flag: '🇸🇳', country: 'Senegal', code: 'SN', dialCode: '+221' },
    { flag: '🇷🇸', country: 'Serbia', code: 'RS', dialCode: '+381' },
    { flag: '🇸🇨', country: 'Seychelles', code: 'SC', dialCode: '+248' },
    { flag: '🇸🇱', country: 'Sierra Leone', code: 'SL', dialCode: '+232' },
    { flag: '🇸🇬', country: 'Singapore', code: 'SG', dialCode: '+65' },
    { flag: '🇸🇰', country: 'Slovakia', code: 'SK', dialCode: '+421' },
    { flag: '🇸🇮', country: 'Slovenia', code: 'SI', dialCode: '+386' },
    { flag: '🇸🇧', country: 'Solomon Islands', code: 'SB', dialCode: '+677' },
    { flag: '🇸🇴', country: 'Somalia', code: 'SO', dialCode: '+252' },
    { flag: '🇿🇦', country: 'South Africa', code: 'ZA', dialCode: '+27' },
    { flag: '🇸🇸', country: 'South Sudan', code: 'SS', dialCode: '+211' },
    { flag: '🇪🇸', country: 'Spain', code: 'ES', dialCode: '+34' },
    { flag: '🇱🇰', country: 'Sri Lanka', code: 'LK', dialCode: '+94' },
    { flag: '🇸🇩', country: 'Sudan', code: 'SD', dialCode: '+249' },
    { flag: '🇸🇷', country: 'Suriname', code: 'SR', dialCode: '+597' },
    { flag: '🇸🇪', country: 'Sweden', code: 'SE', dialCode: '+46' },
    { flag: '🇨🇭', country: 'Switzerland', code: 'CH', dialCode: '+41' },
    { flag: '🇸🇾', country: 'Syria', code: 'SY', dialCode: '+963' },
    { flag: '🇹🇼', country: 'Taiwan', code: 'TW', dialCode: '+886' },
    { flag: '🇹🇯', country: 'Tajikistan', code: 'TJ', dialCode: '+992' },
    { flag: '🇹🇿', country: 'Tanzania', code: 'TZ', dialCode: '+255' },
    { flag: '🇹🇭', country: 'Thailand', code: 'TH', dialCode: '+66' },
    { flag: '🇹🇱', country: 'Timor-Leste', code: 'TL', dialCode: '+670' },
    { flag: '🇹🇬', country: 'Togo', code: 'TG', dialCode: '+228' },
    { flag: '🇹🇴', country: 'Tonga', code: 'TO', dialCode: '+676' },
    { flag: '🇹🇹', country: 'Trinidad and Tobago', code: 'TT', dialCode: '+1' },
    { flag: '🇹🇳', country: 'Tunisia', code: 'TN', dialCode: '+216' },
    { flag: '🇹🇷', country: 'Turkey', code: 'TR', dialCode: '+90' },
    { flag: '🇹🇲', country: 'Turkmenistan', code: 'TM', dialCode: '+993' },
    { flag: '🇹🇨', country: 'Turks and Caicos Islands', code: 'TC', dialCode: '+1' },
    { flag: '🇹🇻', country: 'Tuvalu', code: 'TV', dialCode: '+688' },
    { flag: '🇺🇬', country: 'Uganda', code: 'UG', dialCode: '+256' },
    { flag: '🇺🇦', country: 'Ukraine', code: 'UA', dialCode: '+380' },
    { flag: '🇦🇪', country: 'United Arab Emirates', code: 'AE', dialCode: '+971' },
    { flag: '🇺🇸', country: 'United States', code: 'US', dialCode: '+1' },
    { flag: '🇺🇾', country: 'Uruguay', code: 'UY', dialCode: '+598' },
    { flag: '🇺🇿', country: 'Uzbekistan', code: 'UZ', dialCode: '+998' },
    { flag: '🇻🇺', country: 'Vanuatu', code: 'VU', dialCode: '+678' },
    { flag: '🇻🇦', country: 'Vatican City', code: 'VA', dialCode: '+39' },
    { flag: '🇻🇪', country: 'Venezuela', code: 'VE', dialCode: '+58' },
    { flag: '🇻🇳', country: 'Vietnam', code: 'VN', dialCode: '+84' },
    { flag: '🇻🇮', country: 'Virgin Islands (U.S.)', code: 'VI', dialCode: '+1' },
    { flag: '🇼🇫', country: 'Wallis and Futuna', code: 'WF', dialCode: '+681' },
    { flag: '🇾🇪', country: 'Yemen', code: 'YE', dialCode: '+967' },
    { flag: '🇿🇲', country: 'Zambia', code: 'ZM', dialCode: '+260' },
    { flag: '🇿🇼', country: 'Zimbabwe', code: 'ZW', dialCode: '+263' }
];
function populateCPicker(options){
    for (var i = 0; i < options.length; i++) {
        var option = document.createElement("option");
        option.value = options[i].dialCode; 
        option.dataset.countryCode = options[i].code;
        option.innerHTML = `${options[i].flag} ${options[i].country}`;
        document.getElementById('cpick').appendChild(option); 
    }
}
function handleCountryChange(){
    var newValue = document.getElementById('cpick').value;
    document.getElementById('phoneInp').value = `${newValue} `;
    document.getElementById('phoneInp').focus();
}


async function submitDetails(method='text'){
    const name = document.getElementById('nameInp').value;
    const phoneNum = document.getElementById('phoneInp').value.replace(/\s/g, "");

    const options = {
		method: "POST", //define type of request
		headers: {
			"Content-type": "application/json", //appropiate headers are set
		},
		body: JSON.stringify({
            name: name,
            phone: phoneNum,
            method: method
        }), 
	};
	const response = await fetch("/phone/verify", options); 
	const res = await response.json(); 
    
    if (res.done){
        alert(res.message);
    }
}
populateCPicker(countriesData);
handleCountryChange();