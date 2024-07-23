document.addEventListener('DOMContentLoaded', () => {
    const timetable = document.querySelector('.timetable');
    const subjects = document.querySelectorAll('.subject');
    const timetableCells = document.querySelectorAll('.timetable td');
    const hiddenForm = document.getElementById('hiddenForm');
    const speichernButton = document.getElementById('speichern');
    const abgebenButton = document.getElementById('abgeben');

    subjects.forEach(subject => {
        makeDraggable(subject);
    });

    timetableCells.forEach(cell => {
        cell.addEventListener('dragover', dragOver);
        cell.addEventListener('dragenter', dragEnter);
        cell.addEventListener('dragleave', dragLeave);
        cell.addEventListener('drop', dragDrop);
    });

    timetable.addEventListener('click', (event) => {
        const subjectElement = event.target.closest('.subject');
        if (subjectElement && !subjectElement.classList.contains('cloned')) {
            removeModule(subjectElement);
        }
    });

    let draggedSubject = null;

    function makeDraggable(subject) {
        subject.setAttribute('draggable', 'true');
        subject.addEventListener('dragstart', dragStart);
        subject.addEventListener('dragend', dragEnd);
    }

    function dragStart(event) {
        draggedSubject = this;
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', this.textContent);
        event.dataTransfer.setData('length', this.dataset.length);
        this.classList.add('dragging');
    }

    function dragEnd() {
        this.classList.remove('dragging');
    }

    function dragOver(event) {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }

    function dragEnter(event) {
        event.preventDefault();
        this.classList.add('hovered');
    }

    function dragLeave() {
        this.classList.remove('hovered');
    }

    function dragDrop(event) {
        event.preventDefault();
        const subjectLength = parseFloat(event.dataTransfer.getData('length'));
        const { startTime, endTime, day } = getTimeAndDayFromCell(this, subjectLength);

        if (isValidDropTarget(this, subjectLength)) {
            const newSubject = draggedSubject.cloneNode(true);
            newSubject.classList.add('dropped-subject');
            newSubject.dataset.startTime = startTime;
            newSubject.dataset.endTime = endTime;
            newSubject.dataset.day = day;
            newSubject.dataset.subjectId = draggedSubject.dataset.subjectId;

            let timeSpan = newSubject.querySelector('.time-span');
            if (!timeSpan) {
                timeSpan = document.createElement('div');
                timeSpan.classList.add('time-span');
                newSubject.insertBefore(timeSpan, newSubject.firstChild);
            }
            timeSpan.textContent = `${startTime} - ${endTime}`;

            this.appendChild(newSubject);
            makeDraggable(newSubject);

            const originalParentCell = draggedSubject.parentNode;
            if (originalParentCell !== this) {
                removeSubjectAndClones(originalParentCell, parseFloat(draggedSubject.dataset.length));
            }

            let currentCell = this;
            for (let i = 1; i < subjectLength; i++) {
                currentCell = getNextCell(currentCell);
                if (currentCell) {
                    const clone = newSubject.cloneNode(true);
                    clone.classList.add('cloned');
                    clone.dataset.startTime = startTime;
                    clone.dataset.endTime = endTime;
                    clone.dataset.day = day;
                    currentCell.appendChild(clone);
                } else {
                    break;
                }
            }

            highlightOriginal(newSubject);
        }

        this.classList.remove('hovered');
    }

    function isValidDropTarget(cell, length) {
        const cellIndex = Array.from(timetableCells).indexOf(cell);
        const colIndex = cellIndex % 7;

        if (colIndex === 0) {
            return false;
        }

        let remainingLength = length;
        let currentCell = cell;
        while (remainingLength > 0 && currentCell) {
            const currentCellIndex = Array.from(timetableCells).indexOf(currentCell);
            const currentColIndex = currentCellIndex % 7;

            if (currentColIndex === 0) { 
                currentCell = getNextCell(currentCell);
                continue; 
            }

            const existingSubject = currentCell.querySelector('.dropped-subject');
            if (existingSubject && parseFloat(existingSubject.dataset.length) > 1) {
                remainingLength--;
            } else if (!currentCell.classList.contains('blocked')) {
                remainingLength--;
            }
            currentCell = getNextCell(currentCell);
        }

        return remainingLength === 0;
    }

    function getNextCell(cell) {
        const cellIndex = Array.from(timetableCells).indexOf(cell);
        const rowIndex = Math.floor(cellIndex / 7);
        const nextRowIndex = rowIndex + 1;

        if (nextRowIndex * 7 >= timetableCells.length) {
            return null;
        } else {
            return timetableCells[nextRowIndex * 7 + (cellIndex % 7)];
        }
    }

    function getTimeAndDayFromCell(cell, length) {
        const row = cell.parentElement;
        const startTimeText = row.querySelector('td:first-child').textContent.split(' - ')[0];
        const endTimeText = calculateEndTime(startTimeText, length);
        const day = cell.cellIndex - 1;
        return { startTime: startTimeText, endTime: endTimeText, day };
    }

    function calculateEndTime(startTime, length) {
        const [startHour, startMinute] = startTime.split(':').map(Number);

        let additionalMinutes = 0;
        if (length === 2) {
            additionalMinutes = 15;
        } else if (length === 3) {
            additionalMinutes = 30;
        } else if (length > 3) {
            additionalMinutes = 45 * (length - 1);
        }

        let totalMinutes = startMinute + (length * 90) + additionalMinutes;
        if (length === 2 && startTime === '11:45') {
            totalMinutes += 45;
        }
        let endHour = startHour + Math.floor(totalMinutes / 60);
        let endMinute = totalMinutes % 60;

        if (endMinute < 10) {
            endMinute = '0' + endMinute;
        }

        return `${endHour}:${endMinute}`;
    }

    function highlightOriginal(subjectElement) {
        subjects.forEach(subject => {
            subject.classList.remove('highlighted');
        });
        subjectElement.classList.add('highlighted');
    }

    function removeModule(subjectElement) {
        const parentCell = subjectElement.parentNode;
        parentCell.removeChild(subjectElement);

        let currentCell = parentCell;
        const subjectLength = parseFloat(subjectElement.dataset.length);
        for (let i = 1; i < subjectLength; i++) {
            currentCell = getNextCell(currentCell);
            if (currentCell) {
                currentCell.classList.remove('blocked');
                const clonedElement = currentCell.querySelector('.cloned');
                if (clonedElement) {
                    currentCell.removeChild(clonedElement);
                }
            }
        }
    }

    hiddenForm.addEventListener('submit', handleSubmit);

    function handleSubmit(e) {
        e.preventDefault();
        
        const formData = collectFormData();
        console.log('Form Data Submitted:');
        formData.forEach(data => {
            console.log(`${data.name}: ${data.value}`);
        });

        setFormDataToHiddenForm(formData);
    }

    function collectFormData() {
        const formData = [];

        const droppedSubjects = document.querySelectorAll('.dropped-subject');
        droppedSubjects.forEach(subject => {
            const subjectId = subject.dataset.subjectId;
            const time = subject.dataset.startTime.replace(':', '');
            const day = subject.dataset.day;

            formData.push({ name: 'subjectId[]', value: subjectId });
            formData.push({ name: 'time[]', value: time });
            formData.push({ name: 'day[]', value: day });
        });

        return formData;
    }

    function setFormDataToHiddenForm(formData) {
        Array.from(hiddenForm.children).forEach(child => {
            if (child.tagName === 'INPUT' && child.type === 'hidden') {
                hiddenForm.removeChild(child);
            }
        });

        formData.forEach(data => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = data.name;
            input.value = data.value;
            hiddenForm.insertBefore(input, speichernButton);
        });
    }

    function removeSubjectAndClones(cell, length) {
        let currentCell = cell;
        let removedSubjects = 0;
    
        while (removedSubjects < length && currentCell) {
            const subject = currentCell.querySelector('.dropped-subject, .cloned');
            if (subject) {
                currentCell.removeChild(subject);
                currentCell.classList.remove('blocked');
                removedSubjects++; 
            }
            currentCell = getNextCell(currentCell); 
        }
    }
});