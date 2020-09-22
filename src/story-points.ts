import { debounce } from './utils';

const waitMs = 500;

interface State {
  toDO: number;
  inProgress: number;
  done: number;
}

let state: State = { toDO: 0, inProgress: 0, done: 0 };

// Used to transform all units to hours (H)
const pointsTransformations:{
  [key: string]: (x:number) => number 
} = {
  H: function (x: number) {
    return x;
  },
  D: function (x: number) {
    return x * 8;
  },
};

const BACK_END_ESTIMATION_REGEX = /\[(?=(\d+(?:\.\d+)?)(H|D)\])/;
const FRONT_END_ESTIMATION_REGEX = /<(?=(\d+(?:\.\d+)?)(H|D)>)/;

const columns = () => document.querySelectorAll('.js-project-column');

const accumulatePoint = (link: HTMLLinkElement, point: number) => {
  const previousElement = link.previousElementSibling;
  if (previousElement) {
    const isClosed = previousElement.querySelector('.octicon-issue-closed');

    if (isClosed === null) {
      const h3: string =
        link.closest('.js-project-column')?.querySelector('h3')?.innerText ??
        '';

      if (h3 && /In\sprogress/i.test(h3)) {
        state.inProgress = state.inProgress + point;
      } else {
        state.toDO = state.toDO + point;
      }
    } else {
      state.done = state.done + point;
    }
  }
};

const getPoint = (links: NodeList) =>
  Array.from(links)
    .map((link: any) => {
      // Need to be updated if more units will be add not just hours (H) and days (D)
      const match = link.innerText.match(BACK_END_ESTIMATION_REGEX) || link.innerText.match(FRONT_END_ESTIMATION_REGEX);
      console.log(match);
      
      if (match) {
        let point = parseFloat(match[1]);
        const unit:string = match[2];
        // Transform all estimations to be the same unit
        
        point = pointsTransformations[unit](point);

        accumulatePoint(link, point);
        return point;
      }
    })
    .filter((n: number | undefined) => typeof n === 'number')
    .reduce(
      (acc: number, n: number | undefined) =>
        typeof n === 'number' ? acc + n : acc,
      0,
    );

const setProgress = (progressBar: HTMLElement) => {
  const progressBarContainer = progressBar.closest(
    '.js-socket-channel.js-updatable-content',
  );
  if (progressBarContainer) {
    // prevent github to overwrite the width of the bars.
    progressBarContainer.removeAttribute('data-channel');
    progressBarContainer.removeAttribute('data-url');
    progressBarContainer.classList.remove(
      'js-socket-channel',
      'js-updatable-content',
    );
  }

  (progressBar.querySelector('.bg-green') as HTMLSpanElement).style.width = `${
    (state.done / (state.done + state.inProgress + state.toDO)) * 100
  }%`;

  (progressBar.querySelector('.bg-purple') as HTMLSpanElement).style.width = `${
    (state.inProgress / (state.done + state.inProgress + state.toDO)) * 100
  }%`;
};

const showTotalPoint = () => {
  const counter = document.querySelector('.js-column-card-count');

  if (counter) {
    const pointNode = document.querySelector(
      '.js-github-story-points-total-counter',
    ) as HTMLSpanElement;
    const label = `${state.done}H / ${
      state.toDO + state.inProgress + state.done
    }H`;

    const progressBar = document.querySelector(
      '.progress-bar.progress-bar-small',
    ) as HTMLSpanElement;
    setProgress(progressBar);

    if (pointNode) {
      pointNode.innerText = label;
    } else {
      let pointNode = counter.cloneNode(false) as HTMLSpanElement;
      pointNode.classList.add('js-github-story-points-total-counter');
      pointNode.innerText = label;
      pointNode.removeAttribute('aria-label');
      const menu = document.querySelector(
        '.js-updatable-content .js-show-project-menu',
      );
      if (menu) {
        menu.insertAdjacentHTML('beforebegin', pointNode.outerHTML);
      }
    }
  }
};

const callback = () => {
  columns().forEach((column) => {
    console.log(column)
    const links = column.querySelectorAll(
      '.js-project-column-card:not(.d-none) .js-project-card-issue-link',
    );

    const point = getPoint(links);
    console.log(`Column points ${point}`)

    const pointNode = column.querySelector(
      '.js-github-story-points-counter',
    ) as HTMLSpanElement;
    const label = `${point} H`;

    if (point === 0 && !pointNode) {
      return;
    } else if (point === 0 && !!pointNode) {
      pointNode.remove();
    } else {
      if (pointNode) {
        pointNode.innerText = label;
      } else {
        const counter = column.querySelector('.js-column-card-count');

        if (counter) {
          let pointNode = counter.cloneNode(false) as HTMLSpanElement;
          pointNode.classList.add('js-github-story-points-counter');
          pointNode.innerText = label;
          pointNode.setAttribute('aria-label', label);
          counter.insertAdjacentHTML('afterend', pointNode.outerHTML);
        }
      }
    }
  });

  showTotalPoint();
  state = { done: 0, inProgress: 0, toDO: 0 };
};

const observer = new MutationObserver(debounce(callback, waitMs));
const targetNode = document.querySelector('.js-project-columns');

const options = {
  attributes: true,
  subtree: true,
};

if (!!targetNode) {
  observer.observe(targetNode, options);
} else {
  throw new Error('.js-project-columns is missing');
}

