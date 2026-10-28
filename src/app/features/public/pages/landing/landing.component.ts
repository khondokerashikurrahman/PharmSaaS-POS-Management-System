import {
  Component,
  OnInit,
  OnDestroy
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

type HeroAnimationStep =
  | 'delivery'
  | 'inventory'
  | 'scan'
  | 'sale'
  | 'stock'
  | 'growth';

interface Feature {
  icon: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink
  ],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss'
})
export class LandingComponent implements OnInit, OnDestroy {

  // =========================================================
  // TYPEWRITER
  // =========================================================

  phrases: string[] = [
    'Smarter & Faster',
    'Efficient & Organized',
    'Connected & Secure',
    'Ready for Growth',
    'Built for Modern Pharmacies'
  ];

  displayedText = '';

  private phraseIndex = 0;
  private charIndex = 0;
  private isDeleting = false;
  private typingTimer: ReturnType<typeof setTimeout> | null = null;


  // =========================================================
  // HERO VIDEO / ANIMATION
  // =========================================================

  heroAnimationStep: HeroAnimationStep = 'delivery';

  private heroTimer: ReturnType<typeof setInterval> | null = null;

  /*
   * If you use a 16-second video:
   *
   * 0 - 3   Delivery
   * 3 - 5   Inventory
   * 5 - 8   Scan
   * 8 - 11  Sale
   * 11 - 13 Stock
   * 13 - 16 Growth
   */

  videoDuration = 16;


  // =========================================================
  // POS DEMO DATA
  // =========================================================

  currentSaleAmount = 390;

  currentStock = 45;

  salesGrowth = 18;

  todaySales = 48520;

  receiptVisible = false;

  saleCompleted = false;

  stockUpdated = false;

  growthVisible = false;


  // =========================================================
  // FEATURES
  // =========================================================

  features: Feature[] = [
    {
      icon: 'bi bi-cart-check-fill',
      title: 'Smart POS',
      description:
        'Fast and reliable billing with barcode scanning, discounts, customer management and multiple payment options.'
    },
    {
      icon: 'bi bi-box-seam-fill',
      title: 'Inventory Management',
      description:
        'Track medicines, batches, expiry dates, stock levels, purchases and adjustments from one powerful system.'
    },
    {
      icon: 'bi bi-graph-up-arrow',
      title: 'Powerful Reports',
      description:
        'Understand sales, purchases, inventory movement and business performance with real-time reports.'
    },
    {
      icon: 'bi bi-building-fill',
      title: 'Multi-Branch',
      description:
        'Manage multiple pharmacy branches, users, inventory and operations from a centralized platform.'
    },
    {
      icon: 'bi bi-shield-check',
      title: 'Secure & Reliable',
      description:
        'Role-based permissions, secure authentication and organized business data keep your pharmacy protected.'
    }
  ];

  currentFeatureIndex = 0;


  // =========================================================
  // LIFECYCLE
  // =========================================================

  ngOnInit(): void {

    this.startTyping();

    /*
     * This fallback animation is only used when the
     * actual pharmacy-operation.mp4 is not controlling
     * the timeline.
     */
    this.startHeroAnimation();
  }


  ngOnDestroy(): void {

    if (this.typingTimer) {
      clearTimeout(this.typingTimer);
    }

    if (this.heroTimer) {
      clearInterval(this.heroTimer);
    }
  }


  // =========================================================
  // TYPEWRITER
  // =========================================================

  startTyping(): void {

    const currentPhrase =
      this.phrases[this.phraseIndex];

    if (!this.isDeleting) {

      this.displayedText =
        currentPhrase.substring(
          0,
          this.charIndex + 1
        );

      this.charIndex++;

      if (this.charIndex === currentPhrase.length) {

        this.isDeleting = true;

        this.typingTimer =
          setTimeout(() => {
            this.startTyping();
          }, 1800);

        return;
      }

    } else {

      this.displayedText =
        currentPhrase.substring(
          0,
          this.charIndex - 1
        );

      this.charIndex--;

      if (this.charIndex === 0) {

        this.isDeleting = false;

        this.phraseIndex =
          (this.phraseIndex + 1) %
          this.phrases.length;
      }
    }

    const speed =
      this.isDeleting ? 45 : 85;

    this.typingTimer =
      setTimeout(() => {
        this.startTyping();
      }, speed);
  }


  // =========================================================
  // HERO ANIMATION
  // =========================================================

  startHeroAnimation(): void {

    this.runHeroStep('delivery');

    this.heroTimer =
      setInterval(() => {

        switch (this.heroAnimationStep) {

          case 'delivery':
            this.runHeroStep('inventory');
            break;

          case 'inventory':
            this.runHeroStep('scan');
            break;

          case 'scan':
            this.runHeroStep('sale');
            break;

          case 'sale':
            this.runHeroStep('stock');
            break;

          case 'stock':
            this.runHeroStep('growth');
            break;

          case 'growth':
            this.runHeroStep('delivery');
            break;
        }

      }, 2800);
  }


  runHeroStep(
    step: HeroAnimationStep
  ): void {

    this.heroAnimationStep = step;

    this.receiptVisible = false;
    this.saleCompleted = false;
    this.stockUpdated = false;
    this.growthVisible = false;

    switch (step) {

      case 'delivery':

        this.currentStock = 43;

        break;

      case 'inventory':

        this.currentStock = 45;

        break;

      case 'scan':

        this.currentStock = 45;

        break;

      case 'sale':

        this.saleCompleted = true;
        this.receiptVisible = true;

        break;

      case 'stock':

        this.currentStock = 47;
        this.stockUpdated = true;

        break;

      case 'growth':

        this.growthVisible = true;

        break;
    }
  }


  // =========================================================
  // VIDEO SYNCHRONIZATION
  // =========================================================

  /*
   * If the real MP4 is used, this method synchronizes
   * Angular overlays with the actual video timeline.
   */

  syncVideoScene(
    currentTime: number
  ): void {

    if (currentTime < 3) {

      this.runHeroStep('delivery');

    } else if (currentTime < 5) {

      this.runHeroStep('inventory');

    } else if (currentTime < 8) {

      this.runHeroStep('scan');

    } else if (currentTime < 11) {

      this.runHeroStep('sale');

    } else if (currentTime < 13) {

      this.runHeroStep('stock');

    } else {

      this.runHeroStep('growth');
    }
  }


  // =========================================================
  // FEATURES CAROUSEL
  // =========================================================

  previousFeature(): void {

    this.currentFeatureIndex =
      this.currentFeatureIndex === 0
        ? this.features.length - 1
        : this.currentFeatureIndex - 1;
  }


  nextFeature(): void {

    this.currentFeatureIndex =
      (this.currentFeatureIndex + 1) %
      this.features.length;
  }


  goToFeature(index: number): void {

    this.currentFeatureIndex = index;
  }


  // =========================================================
  // MANUAL HERO CONTROLS
  // =========================================================

  showDeliveryAnimation(): void {
    this.runHeroStep('delivery');
  }


  showInventoryAnimation(): void {
    this.runHeroStep('inventory');
  }


  showScanAnimation(): void {
    this.runHeroStep('scan');
  }


  showSaleAnimation(): void {
    this.runHeroStep('sale');
  }


  showStockAnimation(): void {
    this.runHeroStep('stock');
  }


  showGrowthAnimation(): void {
    this.runHeroStep('growth');
  }
}