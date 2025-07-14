document.addEventListener('DOMContentLoaded', () => {
    const activityTableBody = document.querySelector('.activity-selection-section table tbody');
    const activitySubmissionForm = document.getElementById('activity-submission-form');
    const formStatus = document.getElementById('form-status');
    const selectionSummary = document.getElementById('selection-summary');
    const summaryText = document.getElementById('summary-text');

    // لتخزين الأنشطة المختارة لكل موظف
    const employeeSelections = {};

    // ==========================================================
    // هذه الروابط والمعرفات الخاصة بنموذج جوجل الخاص بك        
    // تم استخراجها من الرابط الذي أرسلته لي مسبقاً           
    // ==========================================================
    const GOOGLE_FORM_URL_BASE = 'https://docs.google.com/forms/d/e/1FAIpQLSd7g28wJ6hJ5yG7K4g5k3t2B0mPq9D2v8G9k9k8/formResponse';
    
    const GOOGLE_FORM_ENTRY_IDS = {
        employeeName: 'entry.2005620554',
        departmentName: 'entry.1706692257',
        'اليوم الأول: نشاط 1': 'entry.1996282156',
        'اليوم الأول: نشاط 2': 'entry.766723223',
        'اليوم الأول: نشاط 3': 'entry.1444983995',
        'اليوم الثاني: نشاط 1': 'entry.1755106567',
        'اليوم الثاني: نشاط 2': 'entry.1802996500',
        'اليوم الثاني: نشاط 3': 'entry.888746279',
        'اليوم الثالث: نشاط 1': 'entry.277868512',
        'اليوم الثالث: نشاط 2': 'entry.1118181673',
        'اليوم الثالث: نشاط 3': 'entry.1158652077',
    };
    // ==========================================================


    // معالجة النقر على مربعات الاختيار
    activityTableBody.addEventListener('change', (event) => {
        // نتأكد أن الحدث جاء من مربع اختيار
        if (event.target.type === 'checkbox') {
            const checkbox = event.target;
            const row = checkbox.closest('tr'); // الحصول على الصف الأب (tr)
            const employeeName = row.dataset.employeeName; // اسم الموظف من سمة data-employee-name في الـ tr
            
            const activityDay = checkbox.dataset.activityDay; // اليوم من data-activity-day
            const activityName = checkbox.dataset.activityName; // اسم النشاط من data-activity-name
            
            const fullActivityString = `${activityDay}: ${activityName}`; // مثال: "اليوم الأول: نشاط 1"

            // إذا لم يكن الموظف موجوداً في employeeSelections، أضف كائن له
            if (!employeeSelections[employeeName]) {
                const departmentName = row.children[1].textContent; // افتراض أن اسم الجهة هو في العمود الثاني من الصف
                employeeSelections[employeeName] = {
                    department: departmentName,
                    activities: []
                };
            }

            if (checkbox.checked) { // إذا تم تحديد مربع الاختيار
                // أضف النشاط إلى قائمة اختيارات الموظف إذا لم يكن موجوداً بالفعل
                if (!employeeSelections[employeeName].activities.includes(fullActivityString)) {
                    employeeSelections[employeeName].activities.push(fullActivityString);
                }
            } else { // إذا تم إلغاء تحديد مربع الاختيار
                // إزالة النشاط من قائمة اختيارات الموظف
                employeeSelections[employeeName].activities = employeeSelections[employeeName].activities.filter(item => item !== fullActivityString);
                // إذا لم يعد للموظف أي اختيارات، يمكن حذف اسمه من الكائن
                if (employeeSelections[employeeName].activities.length === 0) {
                    delete employeeSelections[employeeName];
                }
            }
            updateSummaryDisplay(); // تحديث ملخص الأنشطة في أسفل الصفحة
            console.log(employeeSelections); // للمطور: لرؤية حالة الاختيارات في وحدة التحكم
        }
    });

    // تحديث ملخص الأنشطة في أسفل الصفحة
    function updateSummaryDisplay() {
        let summaryParts = [];
        for (const empName in employeeSelections) {
            const data = employeeSelections[empName];
            if (data.activities.length > 0) {
                // إضافة اسم الجهة إلى الملخص
                summaryParts.push(`${empName} (${data.department}): (${data.activities.join('، ')})`);
            }
        }

        if (summaryParts.length > 0) {
            summaryText.textContent = summaryParts.join(' | ');
            selectionSummary.classList.remove('hidden');
        } else {
            selectionSummary.classList.add('hidden');
        }
    }

    // التعامل مع إرسال النموذج إلى Google Forms
    activitySubmissionForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // منع الإرسال الافتراضي للصفحة

        // التحقق مما إذا تم اختيار أي أنشطة
        let hasSelections = false;
        for (const empName in employeeSelections) {
            if (employeeSelections[empName].activities.length > 0) {
                hasSelections = true;
                break;
            }
        }

        if (!hasSelections) {
            formStatus.textContent = 'الرجاء تحديد نشاط واحد على الأقل لأحد المشاركين قبل الإرسال.';
            formStatus.className = 'error';
            formStatus.classList.remove('hidden');
            return;
        }

        formStatus.textContent = 'جاري الإرسال...';
        formStatus.className = ''; 
        formStatus.classList.remove('hidden');

        // حلقة لإرسال البيانات لكل موظف على حدة
        for (const empName in employeeSelections) {
            const empData = employeeSelections[empName];
            
            const formData = new FormData();
            
            // إضافة اسم الموظف واسم الجهة إلى بيانات النموذج
            if (GOOGLE_FORM_ENTRY_IDS.employeeName) {
                formData.append(GOOGLE_FORM_ENTRY_IDS.employeeName, empName);
            }
            if (GOOGLE_FORM_ENTRY_IDS.departmentName) {
                formData.append(GOOGLE_FORM_ENTRY_IDS.departmentName, empData.department);
            }

            // إضافة حالة كل نشاط (محدد 'X' أو فارغ '')
            for (const activityKey in GOOGLE_FORM_ENTRY_IDS) {
                // نتجاهل employeeName و departmentName لأننا أضفناهما بالفعل
                if (activityKey !== 'employeeName' && activityKey !== 'departmentName') {
                    if (empData.activities.includes(activityKey)) {
                        formData.append(GOOGLE_FORM_ENTRY_IDS[activityKey], 'X'); // إذا تم اختيار النشاط، أرسل 'X'
                    } else {
                        formData.append(GOOGLE_FORM_ENTRY_IDS[activityKey], ''); // إذا لم يتم اختياره، أرسل قيمة فارغة
                    }
                }
            }

            try {
                // إرسال الطلب إلى Google Forms
                const response = await fetch(GOOGLE_FORM_URL_BASE, {
                    method: 'POST',
                    body: formData,
                    mode: 'no-cors', // مهم للسماح بالإرسال من النطاقات المختلفة (CORS)
                });
                // بما أننا نستخدم 'no-cors', لن نحصل على استجابة يمكن تحليلها،
                // لكن الطلب سيتم إرساله في الخلفية.

            } catch (error) {
                console.error(`Error sending data for ${empName}:`, error);
                formStatus.textContent = 'حدث خطأ أثناء إرسال بعض البيانات. الرجاء المحاولة مرة أخرى.';
                formStatus.className = 'error';
                return; // التوقف عن الإرسال في حال حدوث خطأ
            }
        }

        // عند الانتهاء من جميع الإرسالات بنجاح
        formStatus.textContent = 'تم إرسال جميع الاختيارات بنجاح إلى جداول البيانات! شكراً لكم.';
        formStatus.className = 'success';
        resetFormAndUI(); // إعادة تعيين النموذج بعد الإرسال
    });

    // دالة لإعادة تعيين النموذج بعد الإرسال
    function resetFormAndUI() {
        // مسح جميع الاختيارات المخزنة
        for (const key in employeeSelections) {
            delete employeeSelections[key];
        }
        
        // إلغاء تحديد جميع مربعات الاختيار في الجدول
        document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = false;
        });
        
        // تحديث الملخص لإخفائه
        updateSummaryDisplay();
    }

    // استدعاء الأنشطة في البداية لتحديث الملخص (فقط في حال وجود بيانات مخزنة من قبل)
    updateSummaryDisplay();
});
