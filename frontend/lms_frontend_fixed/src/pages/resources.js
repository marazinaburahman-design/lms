export const resources = {
  students: {
    title:'Students', roles:['admin','staff','teacher'], endpoint:'/students', key:'students', singular:'Student', write:['admin','staff'], delete:['admin'], search:true,
    fields:[
      ['registrationNo','Registration No','text',true],['firstName','First name','text',true],['lastName','Last name','text'],['email','Email','email'],['phone','Phone','text',true],['alternatePhone','Alternate phone','text'],['telegramNumber','Telegram number','text'],['nic','NIC','text'],['dateOfBirth','Date of birth','date'],['gender','Gender','select',false,['male','female','other','prefer_not_to_say']],['address','Address','textarea'],['city','City','text'],['country','Country','text'],['guardianName','Guardian name','text'],['guardianPhone','Guardian phone','text'],['status','Status','select',false,['active','inactive','completed','dropped']],
    ], columns:['registrationNo','firstName','lastName','phone','status']
  },
  teachers: {
    title:'Teachers', roles:['admin','staff'], endpoint:'/teachers', key:'teachers', singular:'Teacher', write:['admin','staff'], delete:['admin'],
    fields:[['employeeNo','Employee No','text',true],['name','Name','text',true],['email','Email','email'],['phone','Phone','text'],['specialization','Specialization','text'],['status','Status','select',false,['active','inactive']]], columns:['employeeNo','name','email','specialization','status']
  },
  courses: {
    title:'Courses', roles:['admin','staff','teacher','student'], endpoint:'/courses', key:'courses', singular:'Course', write:['admin','staff'], delete:['admin'],
    fields:[['code','Code','text',true],['name','Name','text',true],['description','Description','textarea'],['duration','Duration','text'],['fee','Fee','number',true],['currency','Currency','text'],['status','Status','select',false,['active','inactive','archived']],['teachers','Teachers','multiselect',false,'teachers']], columns:['code','name','duration','fee','status']
  },
  batches: {
    title:'Batches', roles:['admin','staff','teacher','student'], endpoint:'/batches', key:'batches', singular:'Batch', write:['admin','staff'], delete:['admin'],
    fields:[['name','Name','text',true],['code','Code','text',true],['course','Course','relation',true,'courses'],['teacher','Teacher','relation',false,'teachers'],['startDate','Start date','date'],['endDate','End date','date'],['schedule','Schedule','text'],['room','Room','text'],['capacity','Capacity','number'],['status','Status','select',false,['upcoming','active','completed','cancelled']],['topic','Topic','text'],['mentorName','Mentor name','text'],['classDate','One-off class date','date'],['cancelled','Cancelled','checkbox']], columns:['name','code','course','teacher','status']
  },
  enrollments: {
    title:'Enrollments', roles:['admin','staff','teacher','student'], endpoint:'/enrollments', key:'enrollments', singular:'Enrollment', write:['admin','staff'], delete:['admin'],
    fields:[['student','Student','relation',true,'students'],['course','Course','relation',true,'courses'],['batch','Batch','relation',false,'batches'],['status','Status','select',false,['pending','active','completed','cancelled']],['agreedFee','Agreed fee','number'],['discount','Discount','number'],['notes','Notes','textarea']], columns:['student','course','batch','status','agreedFee']
  },
  assignments: {
    title:'Assignments', roles:['admin','staff','teacher','student'], endpoint:'/assignments', key:'data', singular:'Assignment', write:['admin','staff','teacher'], delete:['admin','staff'],
    fields:[['title','Title','text',true],['description','Description','textarea'],['course','Course','relation',true,'courses'],['batch','Batch','relation',false,'batches'],['dueDate','Due date','date'],['maxMarks','Max marks','number',true]], columns:['title','course','batch','dueDate','maxMarks']
  },
  attendance: {
    title:'Attendance', roles:['admin','staff','teacher','student'], endpoint:'/attendance', key:'data', singular:'Attendance', write:['admin','staff','teacher'], delete:['admin','staff'],
    fields:[['student','Student','relation',true,'students'],['batch','Batch','relation',true,'batches'],['date','Date','date',true],['status','Status','select',true,['present','absent','late','excused']],['notes','Notes','textarea']], columns:['student','batch','date','status','notes']
  },
  grades: {
    title:'Grades', roles:['admin','staff','teacher','student'], endpoint:'/grades', key:'data', singular:'Grade', write:['admin','staff','teacher'], delete:['admin','staff'],
    fields:[['student','Student','relation',true,'students'],['assignment','Assignment','relation',false,'assignments'],['course','Course','relation',false,'courses'],['marks','Marks','number',true],['maxMarks','Max marks','number',true],['grade','Grade','text'],['feedback','Feedback','textarea']], columns:['student','assignment','marks','maxMarks','grade']
  },
}
