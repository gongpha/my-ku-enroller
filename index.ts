import crypto from "crypto";

const username = "";
const password = "";

const semester = "2";
const academicYear = "2566";

const searchQuery : string[] = [
	// put your subject codes here
];
const enrollFirstChoice = true; // if true, enroll first choice if available (if false, enroll all available)

/*
const specificSections = {
}*/


const appKey = 'txCR5732xYYWDGdd49M3R19o1OVwdRFc'; // ?
const campusCode : string | undefined = undefined; // undefined = all campuses ?

const agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0"
//////////////////////////////////////////////////////

const headers = {
	'Content-Type': 'application/json; charset=utf-8',
	'app-key': appKey,
	'User-Agent': agent
}

let accessToken = ''

function encrypt(data : string) {
	var n = Buffer.from(data, 'utf8');
	return crypto.publicEncrypt({
		key: '-----BEGIN PUBLIC KEY-----\nMIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAytOhlq/JPcTN0fX+VqObE5kwIaDnEtso2KGHdi9y7uTtQA6pO4fsPNJqtXOdrcfDgp/EQifPwVRZpjdbVrD6FgayrQQILAnARKzVmzwSMDdaP/hOB6i9ouKsIhN9hQUmUhbhaMkh7UXoxGW+gCSK8dq0+FJVnlt1dtJByiVAJRi2oKSdLRqNjk8yGzuZ6SrEFzAgYZwmQiywUF6V1ZaMUQDz8+nr9OOVU3c6Z2IQXCbOv6S7TAg0VhriFL18ZxUPS6759SuKC63VOOSf4EEHy1m0qBgpCzzlsB7D4ssF9x0ZVXLREFrqikP71Hg6tSGcu4YBKL+VwIDWWaXzz6szxeDXdYTA3l35P7I9uBUgMznIjTjNaAX4AXRsJcN9fpF7mVq4eK1CorBY+OOzOc+/yVBpKysdaV/yZ+ABEhX93B2kPLFSOPUKjSPK2rtqE6h2NSl5BFuGEoVBerKn+ymOnmE4/SDBSe5S6gIL5vwy5zNMsxWUaUF5XO9Ez+2v8+yPSvQydj3pw5Rlb07mAXcI18ZYGClO6g/aKL52KYnn1FZ/X3r8r/cibfDbuXC6FRfVXJmzikVUqZdTp0tOwPkh4V0R63l2RO9Luy7vG6rurANSFnUA9n842KkRtBagQeQC96dbC0ebhTj+NPmskklxr6/6Op/P7d+YY76WzvQMvnsCAwEAAQ==\n-----END PUBLIC KEY-----',
		passphrase: '',
		padding: crypto.constants.RSA_PKCS1_OAEP_PADDING
	}, n).toString('base64')
}

async function run() {
	/* LOGIN */
	const credential = {
		username: encrypt(username),
		password: encrypt(password)
	
	}
	let response = await fetch("https://myapi.ku.th/auth/login", {
		method: 'POST',
		body: JSON.stringify(credential),
		headers: headers
	});
	let object = await response.json();

	if (response.status !== 200) {
		console.log('failed lmao');
		return;
	}

	accessToken = object.accesstoken;

	console.log("Logged in as \x1b[42m\x1b[30m " + object.user.idCode + " " + object.user.firstNameEn + " " + object.user.lastNameEn + " \x1b[0m")

	/* GET SUBJECTS */
	for (const query of searchQuery) {
		await eachQuery(query);
	}
	
}

interface Subject {
	subjectCode: string,
	subjectNameTh: string,
	subjectNameEn: string,
	credit: string,
	theoryHour: string,
	practiceHour: string,
	selfHour: string,
	subjectType: string,
	flagCur: string,
	creditShow: string
}

interface ScheduleClass {
	day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun',
    timeFrom: number,
    timeTo: number,
    time: string,
    room: string
}

interface Section {
	sectionId: number,
	subjectCode: string,
	subjectShow: string,
	minCredit: number,
	maxCredit: number,
	creditShow: string,
	academicYear: string,
	semester: string,
	totalSeat: number,
	totalRegistered: number,
	full: boolean,
	sectionCode: string,
	sectionType: string,
	sectionTypeTh: string,
	sectionTypeEn: string,
	campusCode: string,
	studentStatusCode: string,
	allowEnroll: boolean,
	notAllowCode: null,
	notAllowMessage: null,
	scheduleClass: ScheduleClass[],
	subjectType: string,
	lecAndLab: [], // ?
	eduLevelCode: string,
	fixEnrollType: string
}

async function eachQuery(query: string) : Promise<void> {
	const success = {}

	const params = {
		query: query,
		academicYear: academicYear,
		semester: semester,
		...campusCode  && { campusCode: campusCode }
	}
	const response = await fetch(
		"https://myapi.ku.th/enroll/searchSubjectMapping?" + new URLSearchParams(params), {
			method: 'GET',
			headers: {
				'x-access-token': accessToken,
				...headers
			}
		}
	);
	const object = await response.json();

	if (response.status !== 200) {
		console.log('!!! failed lmao !!!');
	}

	const subjects : Subject[] = object.subjects;
	if (subjects.length === 0) {
		printWarning("No subject found for query \x1b[45m\x1b[30m " + query + " ");
	}

	if (enrollFirstChoice) {
		console.log("Enrolling first choice for query \x1b[45m\x1b[30m " + query + " \x1b[0m")
		await eachSubject(subjects[0]);
	} else {
		console.log("Enrolling all available for query \x1b[45m\x1b[30m " + query + " \x1b[0m")
		for (const subject of subjects) {
			await eachSubject(subject);
		}
	}
}

type CompleteSections = string[];

async function eachSubject(subject : Subject) : Promise<void> {
	const success : CompleteSections = [];

	console.log('\x1b[41m  \x1b[43m  \x1b[42m  \x1b[44m  \x1b[40m ' + subject.subjectCode + " : " + subject.subjectNameTh + " (" + subject.subjectNameEn + ")  \x1b[44m  \x1b[42m  \x1b[43m  \x1b[41m  \x1b[0m");
	const params = {
		subjectCode: subject.subjectCode,
		academicYear: academicYear,
		semester: semester,
	}
	const response = await fetch(
		"https://myapi.ku.th/enroll/searchSection?" + new URLSearchParams(params), {
			method: 'GET',
			headers: {
				'x-access-token': accessToken,
				...headers
			}
		}
	);
	const object = await response.json();

	if (response.status !== 200) {
		console.log('!!! failed lmao !!!');
		return;
	}

	const sections : Section[] = object.sections;

	console.log();

	for (const section of sections) {
		console.log(`\x1b[46m\x1b[30m Section ${section.sectionCode} \x1b[0m`);
		for (const scheduleClass of section.scheduleClass) {
			printTime(scheduleClass);
		}
	}
}

function printTime(scheduleClass : ScheduleClass) : void {
	const dayColor = {
		'Mon': "\x1b[43m\x1b[30m",
		'Tue': "\x1b[45m\x1b[30m",
		'Wed': "\x1b[42m\x1b[30m",
		'Thu': "\x1b[41m\x1b[30m",
		'Fri': "\x1b[44m\x1b[30m",
		'Sat': "\x1b[45m\x1b[30m",
		'Sun': "\x1b[41m\x1b[37m"
	}
	console.log(dayColor[scheduleClass.day] + " " + scheduleClass.day + " \x1b[0m " + scheduleClass.time + " [" + scheduleClass.room + "]");
}

function printWarning(s : string) : void {
	console.log('\x1b[43m\x1b[30m <!> ' + s + ' \x1b[0m');
}

run()