document.addEventListener('DOMContentLoaded', () => {
    const activityTableBody = document.querySelector('.activity-selection-section table tbody');
    // رؤوس الأنشطة الفرعية التي تحتوي على data-activity-day و data-activity-name
    const activityHeaders = document.querySelectorAll('table thead th[data-activity-day][data-activity-name]');
    
    const allSelectionsDataInput = document.getElementById('allSelectionsData');
    const activitySubmissionForm = document.getElementById('activity-submission-form');
    const formStatus = document.getElementById('form-status');
    const selectionSummary = document.getElementById('selection-summary');
    const summaryText = document.getElementById('summary-text');

    // لتخزين الأنشطة المختارة لكل موظف
    // الهيكل: { "اسم الموظف": ["اليوم الأول: نشاط 1", "اليوم الثاني: نشاط 3"], ... }
    const employeeSelections = {};

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

            // إذا لم يكن الموظف موجوداً في employeeSelections، أضف مصفوفة فارغة له
            if (!employeeSelections[employeeName]) {
                employeeSelections[employeeName] = [];
            }

            if (checkbox.checked) { // إذا تم تحديد مربع الاختيار
                // أضف النشاط إلى قائمة اختيارات الموظف إذا لم يكن موجوداً بالفعل
                if (!employeeSelections[employeeName].includes(fullActivityString)) {
                    employeeSelections[employeeName].push(fullActivityString);
                }
            } else { // إذا تم إلغاء تحديد مربع الاختيار
                // إزالة النشاط من قائمة اختيارات الموظف
                employeeSelections[employeeName] = employeeSelections[employeeName].filter(item => item !== fullActivityString);
                // إذا لم يعد للموظف أي اختيارات، يمكن حذف اسمه من الكائن
                if (employeeSelections[employeeName].length === 0) {
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
            if (employeeSelections[empName].length > 0) {
                // إضافة اسم الجهة إلى الملخص
                const employeeRow = document.querySelector(`tr[data-employee-name="${employeeName}"]`);
                const departmentName = employeeRow ? employeeRow.children[1].textContent : 'غير معروف'; // العمود الثاني هو الجهة
                
                summaryParts.push(`${empName} (${departmentName}): (${employeeSelections[empName].join('، ')})`);
            }
        }

        if (summaryParts.length > 0) {
            summaryText.textContent = summaryParts.join(' | ');
            selectionSummary.classList.remove('hidden');
        } else {
            selectionSummary.classList.add('hidden');
        }
    }

    // التعامل مع إرسال النموذج باستخدام Formspree
    activitySubmissionForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // منع الإرسال الافتراضي للصفحة

        // التحقق مما إذا تم اختيار أي أنشطة
        let hasSelections = false;
        for (const empName in employeeSelections) {
            if (employeeSelections[empName].length > 0) {
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

        // تجهيز البيانات للإرسال
        let formattedSelections = [];
        for (const empName in employeeSelections) {
            if (employeeSelections[empName].length > 0) {
                // إضافة اسم الجهة إلى البيانات المرسلة
                const employeeRow = document.querySelector(`tr[data-employee-name="${employeeName}"]`);
                const departmentName = employeeRow ? employeeRow.children[1].textContent : 'غير معروف';
                formattedSelections.push(`${empName} (${departmentName}): ${employeeSelections[empName].join(', ')}`);
            }
        }
        allSelectionsDataInput.value = formattedSelections.join(' | '); // ملء الحقل المخفي

        const form = event.target;
        const data = new FormData(form);

        try {
            const response = await fetch(form.action, {
                method: form.method,
                body: data,
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                formStatus.textContent = 'تم إرسال جميع الاختيارات بنجاح! شكراً لكم.';
                formStatus.className = 'success';
                
                // إعادة تعيين الواجهة بعد الإرسال الناجح
                resetFormAndUI();
            } else {
                const result = await response.json();
                if (Object.hasOwnProperty.call(result, 'errors')) {
                    formStatus.textContent = result.errors.map(error => error.message).join(', ');
                } else {
                    formStatus.textContent = 'حدث خطأ أثناء الإرسال. الرجاء المحاولة مرة أخرى.';
                }
                formStatus.className = 'error';
            }
        } catch (error) {
            formStatus.textContent = 'حدث خطأ في الاتصال. الرجاء التحقق من اتصال الإنترنت والمحاولة مرة أخرى.';
            formStatus.className = 'error';
            console.error('Fetch error:', error);
        }
    });

    // وظيفة لإعادة تعيين النموذج والواجهة بالكامل بعد الإرسال
    function resetFormAndUI() {
        // مسح جميع الاختيارات من الكائن
        for (const key in employeeSelections) {
            delete employeeSelections[key];
        }
        
        // إعادة تعيين مربعات الاختيار في الجدول
        document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = false; // إلغاء تحديد جميع مربعات الاختيار
        });
        
        // مسح الحقل المخفي
        allSelectionsDataInput.value = '';
        
        // إخفاء ملخص الاختيارات
        updateSummaryDisplay();
    }

    // تهيئة عرض الملخص عند تحميل الصفحة لأول مرة
    updateSummaryDisplay();
});