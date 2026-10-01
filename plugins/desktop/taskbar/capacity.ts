import { useLayoutEffect, useState, type RefObject } from "react";

/** How many Quick Launch icons and task buttons fit in the taskbar, keeping room for a couple of tasks first. */

const TASK_MIN_WIDTH = 96;
const TASK_GAP = 3;
const TASK_MORE_WIDTH = 44;
const QUICK_ITEM_WIDTH = 27;
const QUICK_CHROME_WIDTH = 26;
const TASKS_BEFORE_QUICK = 2;

interface TaskbarCapacity {
  quick: number;
  tasks: number;
}

export function useTaskbarCapacity(navRef: RefObject<HTMLElement | null>, quickCount: number, taskCount: number): TaskbarCapacity {
  const [capacity, setCapacity] = useState<TaskbarCapacity>({ quick: quickCount, tasks: taskCount });
  useLayoutEffect(() => {
    const nav = navRef.current;
    if (nav === null) return;
    const measure = () => {
      const limit = Number.parseFloat(getComputedStyle(nav).maxWidth);
      const fixed = [...nav.querySelectorAll<HTMLElement>(":scope > .bbd-start, :scope > .bbd-tray")]
        .reduce((total, element) => total + element.getBoundingClientRect().width, 0);
      const available = (Number.isFinite(limit) ? limit : window.innerWidth - 24) - fixed - 18 - QUICK_CHROME_WIDTH;
      const fits = (width: number) => Math.max(0, Math.floor((width + TASK_GAP) / (TASK_MIN_WIDTH + TASK_GAP)));
      const reserved = Math.min(taskCount, TASKS_BEFORE_QUICK);
      let quick = quickCount;
      while (quick > 0 && fits(available - quick * QUICK_ITEM_WIDTH) < reserved) quick -= 1;
      const room = available - quick * QUICK_ITEM_WIDTH;
      const tasks = fits(room) >= taskCount ? taskCount : fits(room - TASK_MORE_WIDTH - TASK_GAP);
      setCapacity((current) => (current.quick === quick && current.tasks === tasks ? current : { quick, tasks }));
    };
    measure();
    const observer = new ResizeObserver(measure);
    for (const element of nav.querySelectorAll(":scope > .bbd-start, :scope > .bbd-tray")) {
      observer.observe(element);
    }
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  });
  return capacity;
}
